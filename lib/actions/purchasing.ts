"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { applyMovement, nextDocNumber } from "@/lib/services/stock";
import { checkWriter, requireWriter } from "@/lib/auth/session";
import { UserError, toUserMessage } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

type LineItem = { productId: string; quantity: number; unitCost: number };

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
      unitCost: Number((i as LineItem).unitCost ?? 0),
    }))
    .filter((i) => i.productId && i.quantity > 0);
  if (items.length === 0) throw new UserError("Add at least one line item.");
  return items;
}

/** Create a draft purchase order with line items. */
export async function createPurchaseOrder(formData: FormData) {
  const actor = await requireWriter();
  const supplierId = String(formData.get("supplierId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseItems(String(formData.get("items") ?? "[]"));

  if (!supplierId) throw new UserError("Select a supplier.");

  const poNumber = await nextDocNumber("PO");
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      notes,
      status: "DRAFT",
      createdById: actor.id,
      items: {
        create: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      },
    },
  });

  revalidatePath("/purchase-orders");
  redirect(`/purchase-orders/${po.id}`);
}

/** Move a draft PO to ORDERED. */
export async function markPurchaseOrderOrdered(id: string): Promise<ActionResult> {
  const auth = await checkWriter();
  if ("error" in auth) return { ok: false, error: auth.error };
  try {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new UserError("Purchase order not found.");
    if (po.status !== "DRAFT") throw new UserError("Only draft orders can be marked as ordered.");
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "ORDERED", orderedAt: new Date() },
    });
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };
  }
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/purchase-orders");
  return { ok: true };
}

/** Receive a PO: create PURCHASE_IN movements for each item, exactly once. */
export async function receivePurchaseOrder(id: string): Promise<ActionResult> {
  const auth = await checkWriter();
  if ("error" in auth) return { ok: false, error: auth.error };
  try {
    await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!po) throw new UserError("Purchase order not found.");
      if (po.status === "RECEIVED") throw new UserError("This order has already been received.");
      if (po.status === "CANCELLED") throw new UserError("Cancelled orders cannot be received.");

      for (const item of po.items) {
        await applyMovement(tx, {
          productId: item.productId,
          type: "PURCHASE_IN",
          quantity: item.quantity,
          reason: `Received ${po.poNumber}`,
          referenceType: "PURCHASE_ORDER",
          referenceId: po.id,
          unitCost: Number(item.unitCost),
          createdById: auth.user.id,
        });
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "RECEIVED", receivedAt: new Date() },
      });
    });
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };
  }
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/purchase-orders");
  revalidatePath("/products");
  revalidatePath("/products/[id]", "page");
  revalidatePath("/");
  return { ok: true };
}

/** Cancel a PO that has not been received. */
export async function cancelPurchaseOrder(id: string): Promise<ActionResult> {
  const auth = await checkWriter();
  if ("error" in auth) return { ok: false, error: auth.error };
  try {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new UserError("Purchase order not found.");
    if (po.status === "RECEIVED") throw new UserError("Received orders cannot be cancelled.");
    await prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };
  }
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/purchase-orders");
  return { ok: true };
}
