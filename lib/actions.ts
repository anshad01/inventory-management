"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

// Server Actions = the write side of the backend. All stock changes go through
// createMovement so Product.quantityOnHand stays a transactional cache of the
// movement history — quantity is never edited directly (SPEC.md §4).

const SEED_USER_ID = "u_priya"; // stand-in until credential auth lands.

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Record a stock movement and update the cached quantity in one transaction.
 * Rejects changes that would drive quantity below zero (no negative stock).
 */
export async function adjustStock(
  productId: string,
  delta: number,
  reason?: string,
): Promise<ActionResult> {
  if (!Number.isInteger(delta) || delta === 0) {
    return { ok: false, error: "Enter a non-zero whole number." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { quantityOnHand: true },
      });
      if (!product) throw new Error("Product not found.");

      const next = product.quantityOnHand + delta;
      if (next < 0) {
        throw new Error(
          `Not enough stock: ${product.quantityOnHand} on hand, cannot remove ${Math.abs(delta)}.`,
        );
      }

      await tx.stockMovement.create({
        data: {
          productId,
          type: "ADJUSTMENT",
          quantity: delta,
          reason: reason?.trim() || null,
          referenceType: "MANUAL",
          createdById: SEED_USER_ID,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { quantityOnHand: next },
      });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

/** Create a product, then create an opening PURCHASE_IN movement if it starts
 * with stock (so the quantity is explainable by the movement history). */
export async function createProduct(formData: FormData) {
  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const supplierId = String(formData.get("supplierId") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const costPrice = Number(formData.get("costPrice") ?? 0);
  const sellPrice = Number(formData.get("sellPrice") ?? 0);
  const reorderPoint = parseInt(String(formData.get("reorderPoint") ?? "0"), 10) || 0;
  const openingQty = parseInt(String(formData.get("openingQty") ?? "0"), 10) || 0;

  if (!sku || !name) {
    throw new Error("SKU and name are required.");
  }

  const existing = await prisma.product.findUnique({ where: { sku } });
  if (existing) {
    throw new Error(`A product with SKU "${sku}" already exists.`);
  }

  const product = await prisma.product.create({
    data: {
      sku,
      name,
      description,
      categoryId,
      supplierId,
      costPrice,
      sellPrice,
      reorderPoint,
      quantityOnHand: 0,
    },
  });

  if (openingQty > 0) {
    await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: "PURCHASE_IN",
          quantity: openingQty,
          reason: "Opening stock",
          referenceType: "MANUAL",
          unitCost: costPrice,
          createdById: SEED_USER_ID,
        },
      }),
      prisma.product.update({
        where: { id: product.id },
        data: { quantityOnHand: openingQty },
      }),
    ]);
  }

  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/products/${product.id}`);
}

/** Create a supplier. */
export async function createSupplier(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name) throw new Error("Supplier name is required.");

  await prisma.supplier.create({ data: { name, email, phone } });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}
