"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { applyMovement, nextDocNumber } from "@/lib/services/stock";
import { checkWriter, requireWriter } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/types";

type LineItem = { productId: string; quantity: number; unitPrice: number };

function parseItems(raw: string): LineItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    throw new Error("Invalid line items.");
  }
  if (!Array.isArray(parsed)) throw new Error("Invalid line items.");
  const items = parsed
    .map((i) => ({
      productId: String((i as LineItem).productId ?? ""),
      quantity: Number((i as LineItem).quantity ?? 0),
      unitPrice: Number((i as LineItem).unitPrice ?? 0),
    }))
    .filter((i) => i.productId && i.quantity > 0);
  if (items.length === 0) throw new Error("Add at least one line item.");
  return items;
}

/** Valid status transitions for admin */
const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  COMPLETED: ["VOIDED"],
  VOIDED: [],
};

/** Record a completed sale: SALE_OUT movements that draw down stock. */
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
        status: "COMPLETED",
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
    }
    return created;
  });

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/sales/${sale.id}`);
}

/** Advance an order to the next status â€” blocked if transition is invalid. */
export async function advanceOrderStatus(
  id: string,
  newStatus: string,
): Promise<ActionResult> {
  const auth = await checkWriter();
  if ("error" in auth) return { ok: false, error: auth.error };

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!sale) throw new Error("Order not found.");

      const allowed = TRANSITIONS[sale.status] ?? [];
      if (!allowed.includes(newStatus)) {
        throw new Error(
          `Cannot move from ${sale.status} to ${newStatus}.`,
        );
      }

      // If cancelling, restore stock
      if (newStatus === "CANCELLED") {
        for (const item of sale.items) {
          await applyMovement(tx, {
            productId: item.productId,
            type: "ADJUSTMENT",
            quantity: Math.abs(item.quantity),
            reason: `Cancelled order ${sale.saleNumber}`,
            referenceType: "SALE",
            referenceId: sale.id,
            createdById: auth.user.id,
          });
        }
      }

      await tx.sale.update({
        where: { id },
        data: { status: newStatus as any },
      });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }

  revalidatePath(`/sales/${id}`);
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

/** Void a sale (legacy admin action for COMPLETED sales). */
export async function voidSale(id: string): Promise<ActionResult> {
  const auth = await checkWriter();
  if ("error" in auth) return { ok: false, error: auth.error };
  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!sale) throw new Error("Sale not found.");
      if (sale.status === "VOIDED") throw new Error("Already voided.");
      if (!["COMPLETED", "PENDING", "CONFIRMED", "SHIPPED"].includes(sale.status)) {
        throw new Error("Cannot void a delivered or cancelled order.");
      }

      for (const item of sale.items) {
        await applyMovement(tx, {
          productId: item.productId,
          type: "ADJUSTMENT",
          quantity: Math.abs(item.quantity),
          reason: `Void ${sale.saleNumber}`,
          referenceType: "SALE",
          referenceId: sale.id,
          createdById: auth.user.id,
        });
      }

      await tx.sale.update({ where: { id }, data: { status: "VOIDED" } });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/sales/${id}`);
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}
