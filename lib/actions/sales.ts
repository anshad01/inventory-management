"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { applyMovement, nextDocNumber } from "@/lib/services/stock";
import { notify, notifyLowStock } from "@/lib/services/notify";
import { checkWriter, getCurrentUser, requireWriter } from "@/lib/auth/session";
import {
  ORDER_STATUS_LABELS,
  canTransition,
  cancelRestoresStock,
  type SaleStatus,
} from "@/lib/orders";
import { UserError, toUserMessage } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

type LineItem = { productId: string; quantity: number; unitPrice: number };

function parseItems(raw: string): LineItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    throw new UserError("Invalid line items.");
  }
  if (!Array.isArray(parsed)) throw new UserError("Invalid line items.");
  const items = parsed
    .map((i) => ({
      productId: String((i as LineItem).productId ?? ""),
      quantity: Number((i as LineItem).quantity ?? 0),
      unitPrice: Number((i as LineItem).unitPrice ?? 0),
    }))
    .filter((i) => i.productId && i.quantity > 0);
  if (items.length === 0) throw new UserError("Add at least one line item.");
  return items;
}

/** Record an in-store sale made by staff: SALE_OUT movements that draw down
 * stock. These are completed at the counter, so they land as DELIVERED. */
export async function createSale(formData: FormData) {
  const actor = await requireWriter();
  const customerName = String(formData.get("customerName") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseItems(String(formData.get("items") ?? "[]"));

  const saleNumber = await nextDocNumber("SALE");

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        saleNumber,
        customerName,
        notes,
        status: "DELIVERED",
        createdById: actor.id,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
    });

    for (const item of items) {
      await applyMovement(tx, {
        productId: item.productId,
        type: "SALE_OUT",
        quantity: -Math.abs(item.quantity),
        reason: `Sold on ${saleNumber}`,
        referenceType: "SALE",
        referenceId: created.id,
        createdById: actor.id,
      });
      await notifyLowStock(tx, item.productId);
    }
    return created;
  });

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  revalidatePath("/");
  redirect(`/sales/${sale.id}`);
}

/** Advance a customer order to the next state (CONFIRMED / SHIPPED / DELIVERED).
 * Staff-only. Invalid transitions are rejected and the customer is notified. */
export async function advanceOrder(
  id: string,
  to: SaleStatus,
): Promise<ActionResult> {
  const auth = await checkWriter();
  if ("error" in auth) return { ok: false, error: auth.error };
  if (to === "CANCELLED") return cancelOrder(id);

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        select: { id: true, status: true, saleNumber: true, customerUserId: true },
      });
      if (!sale) throw new UserError("Order not found.");
      const from = sale.status as SaleStatus;
      if (!canTransition(from, to)) {
        throw new UserError(
          `Cannot move order from ${ORDER_STATUS_LABELS[from]} to ${ORDER_STATUS_LABELS[to]}.`,
        );
      }
      await tx.sale.update({ where: { id }, data: { status: to } });
      if (sale.customerUserId) {
        await notify(tx, {
          userId: sale.customerUserId,
          type: "ORDER_STATUS",
          message: `Order ${sale.saleNumber} is now ${ORDER_STATUS_LABELS[to].toLowerCase()}.`,
          href: `/shop/orders/${id}`,
        });
      }
    });
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };
  }
  revalidatePaths(id);
  return { ok: true };
}

/** Cancel a customer order. Staff may cancel any order that is still
 * PENDING/CONFIRMED; a customer may cancel their own order while it is PENDING.
 * Cancelling restores the reserved stock (SPEC §5). */
export async function cancelOrder(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are not signed in." };
  const isStaffWriter = user.type === "STAFF" && user.role !== "VIEWER";

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!sale) throw new UserError("Order not found.");

      // Authorization: staff writer, or the owning customer.
      const isOwner =
        user.type === "CUSTOMER" && sale.customerUserId === user.id;
      if (!isStaffWriter && !isOwner) {
        throw new UserError("You cannot cancel this order.");
      }

      const from = sale.status as SaleStatus;
      if (!canTransition(from, "CANCELLED")) {
        throw new UserError(
          `An order that is ${ORDER_STATUS_LABELS[from].toLowerCase()} can no longer be cancelled.`,
        );
      }
      // Customers may only cancel while still pending.
      if (isOwner && !isStaffWriter && from !== "PENDING") {
        throw new UserError("This order can no longer be cancelled. Contact support.");
      }

      if (cancelRestoresStock(from)) {
        for (const item of sale.items) {
          await applyMovement(tx, {
            productId: item.productId,
            type: "ADJUSTMENT",
            quantity: Math.abs(item.quantity),
            reason: `Cancelled ${sale.saleNumber}`,
            referenceType: "SALE",
            referenceId: sale.id,
            createdById: user.id,
          });
        }
      }

      await tx.sale.update({ where: { id }, data: { status: "CANCELLED" } });

      // Notify the customer if staff cancelled on their behalf.
      if (sale.customerUserId && sale.customerUserId !== user.id) {
        await notify(tx, {
          userId: sale.customerUserId,
          type: "ORDER_STATUS",
          message: `Order ${sale.saleNumber} was cancelled.`,
          href: `/shop/orders/${id}`,
        });
      }
    });
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };
  }
  revalidatePaths(id);
  revalidatePath(`/shop/orders/${id}`);
  revalidatePath("/shop/orders");
  return { ok: true };
}

function revalidatePaths(id: string) {
  revalidatePath(`/sales/${id}`);
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  revalidatePath("/");
}
