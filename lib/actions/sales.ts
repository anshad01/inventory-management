"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { applyMovement, nextDocNumber } from "@/lib/services/stock";
import type { ActionResult } from "@/lib/types";

const SEED_USER_ID = "u_priya";

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

/** Record a completed sale: SALE_OUT movements that draw down stock. */
export async function createSale(formData: FormData) {
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
        createdById: SEED_USER_ID,
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
        createdById: SEED_USER_ID,
      });
    }
    return created;
  });

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/sales/${sale.id}`);
}

/** Void a sale: reverse its SALE_OUT movements (returns stock) without deleting
 * history. Creates compensating PURCHASE_IN-style adjustments. */
export async function voidSale(id: string): Promise<ActionResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!sale) throw new Error("Sale not found.");
      if (sale.status === "VOIDED") throw new Error("This sale is already voided.");

      for (const item of sale.items) {
        await applyMovement(tx, {
          productId: item.productId,
          type: "ADJUSTMENT",
          quantity: Math.abs(item.quantity),
          reason: `Void ${sale.saleNumber}`,
          referenceType: "SALE",
          referenceId: sale.id,
          createdById: SEED_USER_ID,
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
