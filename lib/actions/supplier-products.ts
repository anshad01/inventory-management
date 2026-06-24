"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { applyMovement } from "@/lib/services/stock";
import { requireSupplier } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/types";

/** Create a product scoped to the logged-in supplier. */
export async function supplierCreateProduct(
  formData: FormData,
): Promise<void> {
  const user = await requireSupplier();
  const supplierId = user.supplierId!;

  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const sellPrice = parseFloat(String(formData.get("sellPrice") ?? "0")) || 0;
  const costPrice = parseFloat(String(formData.get("costPrice") ?? "0")) || 0;
  const reorderPoint = parseInt(String(formData.get("reorderPoint") ?? "0")) || 0;
  const openingQty = parseInt(String(formData.get("openingQty") ?? "0")) || 0;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  if (!sku || !name) throw new Error("SKU and name are required.");

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        sku,
        name,
        description,
        categoryId,
        supplierId,
        sellPrice,
        costPrice,
        reorderPoint,
        unit: "pcs",
        imageUrl,
      },
    });

    if (openingQty > 0) {
      await applyMovement(tx, {
        productId: created.id,
        type: "PURCHASE_IN",
        quantity: openingQty,
        reason: "Opening stock",
        referenceType: "MANUAL",
        createdById: user.id,
      });
    }

    return created;
  });

  revalidatePath("/portal/products");
  redirect(`/portal/products/${product.id}/edit`);
}

/** Update a product — only if it belongs to the logged-in supplier. */
export async function supplierUpdateProduct(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSupplier();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.supplierId !== user.supplierId) {
    return { ok: false, error: "Product not found." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const sellPrice = parseFloat(String(formData.get("sellPrice") ?? "0")) || 0;
  const costPrice = parseFloat(String(formData.get("costPrice") ?? "0")) || 0;
  const reorderPoint = parseInt(String(formData.get("reorderPoint") ?? "0")) || 0;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  if (!name) return { ok: false, error: "Name is required." };

  try {
    await prisma.product.update({
      where: { id },
      data: { name, description, categoryId, sellPrice, costPrice, reorderPoint, imageUrl },
    });
  } catch {
    return { ok: false, error: "Failed to update product." };
  }

  revalidatePath("/portal/products");
  revalidatePath(`/portal/products/${id}/edit`);
  return { ok: true };
}

/** Deactivate (soft-delete) a product — only if it belongs to the logged-in supplier. */
export async function supplierDeleteProduct(id: string): Promise<ActionResult> {
  const user = await requireSupplier();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.supplierId !== user.supplierId) {
    return { ok: false, error: "Product not found." };
  }

  try {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } catch {
    return { ok: false, error: "Failed to delete product." };
  }

  revalidatePath("/portal/products");
  redirect("/portal/products");
}

/** Adjust stock for a supplier's product. */
export async function supplierAdjustStock(
  productId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSupplier();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.supplierId !== user.supplierId) {
    return { ok: false, error: "Product not found." };
  }

  const delta = parseInt(String(formData.get("delta") ?? "0"));
  const reason = String(formData.get("reason") ?? "").trim() || "Manual adjustment";

  if (delta === 0) return { ok: false, error: "Enter a non-zero quantity." };

  try {
    await prisma.$transaction(async (tx) => {
      await applyMovement(tx, {
        productId,
        type: "ADJUSTMENT",
        quantity: delta,
        reason,
        referenceType: "MANUAL",
        createdById: user.id,
      });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }

  revalidatePath("/portal/products");
  revalidatePath(`/portal/products/${productId}/edit`);
  return { ok: true };
}