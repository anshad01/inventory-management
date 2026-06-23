"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { applyMovement, nextDocNumber } from "@/lib/services/stock";
import type { ActionResult } from "@/lib/types";

const SEED_USER_ID = "u_priya";

type LineItem = { productId: string; quantity: number; unitCost: number };

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
      unitCost: Number((i as LineItem).unitCost ?? 0),
    }))
    .filter((i) => i.productId && i.quantity > 0);
  if (items.length === 0) throw new Error("Add at least one line item.");
  return items;
}

/** Create a draft purchase order with line items. */
export async function createPurchaseOrder(formData: FormData) {
  const supplierId = String(formData.get("supplierId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const items = parseItems(String(formData.get("items") ?? "[]"));

  if (!supplierId) throw new Error("Select a supplier.");

  const poNumber = await nextDocNumber("PO");
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      notes,
      status: "DRAFT",
      createdById: SEED_USER_ID,
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
  try {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new Error("Purchase order not found.");
    if (po.status !== "DRAFT") throw new Error("Only draft orders can be marked as ordered.");
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: "ORDERED", orderedAt: new Date() },
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/purchase-orders");
  return { ok: true };
}

/** Receive a PO: create PURCHASE_IN movements for each item, exactly once. */
export async function receivePurchaseOrder(id: string): Promise<ActionResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!po) throw new Error("Purchase order not found.");
      if (po.status === "RECEIVED") throw new Error("This order has already been received.");
      if (po.status === "CANCELLED") throw new Error("Cancelled orders cannot be received.");

      for (const item of po.items) {
        await applyMovement(tx, {
          productId: item.productId,
          type: "PURCHASE_IN",
          quantity: item.quantity,
          reason: `Received ${po.poNumber}`,
          referenceType: "PURCHASE_ORDER",
          referenceId: po.id,
          unitCost: Number(item.unitCost),
          createdById: SEED_USER_ID,
        });
      }

      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "RECEIVED", receivedAt: new Date() },
      });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/purchase-orders");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

/** Cancel a PO that has not been received. */
export async function cancelPurchaseOrder(id: string): Promise<ActionResult> {
  try {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new Error("Purchase order not found.");
    if (po.status === "RECEIVED") throw new Error("Received orders cannot be cancelled.");
    await prisma.purchaseOrder.update({ where: { id }, data: { status: "CANCELLED" } });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }
  revalidatePath(`/purchase-orders/${id}`);
  revalidatePath("/purchase-orders");
  return { ok: true };
}
