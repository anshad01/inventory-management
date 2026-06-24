"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { applyMovement } from "@/lib/services/stock";
import { fileToDataUrl } from "@/lib/services/image";
import { checkProductManager } from "@/lib/auth/session";
import { UserError, toUserMessage } from "@/lib/errors";
import type { ActionResult } from "@/lib/types";

// Product create / edit / delete (SPEC §3). Usable by STAFF writers and by
// approved SUPPLIER accounts — suppliers are scoped to their own supplier id
// and may only touch their own products (enforced in `loadOwn`).

function parseNum(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(v ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

/** Where to send the user back after a successful write. */
function homeFor(supplierScope: string | null): string {
  return supplierScope ? "/portal/products" : "/products";
}

// These two actions back the shared <ProductForm>, which drives them with
// useActionState — so they take the previous state and return an ActionResult.
// Validation problems come back as { ok: false, error } and render inline
// (keeping the user's input); unexpected failures are sanitised by
// toUserMessage so no Prisma/internal text ever reaches the form.
export async function createProduct(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await checkProductManager();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { user, supplierScope } = auth;

  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  // Suppliers can only create products under their own supplier id.
  const supplierId = supplierScope ?? (String(formData.get("supplierId") ?? "").trim() || null);
  const description = String(formData.get("description") ?? "").trim() || null;
  const costPrice = parseNum(formData.get("costPrice"));
  const sellPrice = parseNum(formData.get("sellPrice"));
  const reorderPoint = Math.trunc(parseNum(formData.get("reorderPoint")));
  const openingQty = Math.trunc(parseNum(formData.get("openingQty")));

  if (!sku || !name) return { ok: false, error: "SKU and name are required." };
  if (!categoryId)
    return { ok: false, error: "Please choose a category — every product must belong to one." };

  let productId: string;
  try {
    const imageUrl = await fileToDataUrl(formData.get("image"));

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) throw new UserError(`A product with SKU "${sku}" already exists.`);

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
        imageUrl,
      },
    });
    productId = product.id;

    if (openingQty > 0) {
      await prisma.$transaction((tx) =>
        applyMovement(tx, {
          productId: product.id,
          type: "PURCHASE_IN",
          quantity: openingQty,
          reason: "Opening stock",
          referenceType: "MANUAL",
          unitCost: costPrice,
          createdById: user.id,
        }),
      );
    }
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };
  }

  revalidatePath("/products");
  revalidatePath("/portal/products");
  revalidatePath("/shop");
  revalidatePath("/");
  redirect(`${homeFor(supplierScope)}/${productId}`);
}

/** Load a product the current manager is allowed to edit, or throw. */
async function loadOwn(id: string, supplierScope: string | null) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new UserError("Product not found.");
  if (supplierScope && product.supplierId !== supplierScope) {
    throw new UserError("You can only manage your own products.");
  }
  return product;
}

export async function updateProduct(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await checkProductManager();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { supplierScope } = auth;

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const costPrice = parseNum(formData.get("costPrice"));
  const sellPrice = parseNum(formData.get("sellPrice"));
  const reorderPoint = Math.trunc(parseNum(formData.get("reorderPoint")));

  if (!name) return { ok: false, error: "Name is required." };
  if (!categoryId)
    return { ok: false, error: "Please choose a category — every product must belong to one." };

  try {
    await loadOwn(id, supplierScope);

    const imageUrl = await fileToDataUrl(formData.get("image"));

    await prisma.product.update({
      where: { id },
      data: {
        name,
        categoryId,
        description,
        costPrice,
        sellPrice,
        reorderPoint,
        // Only overwrite the image when a new one was uploaded.
        ...(imageUrl ? { imageUrl } : {}),
        // Suppliers can't reassign a product to another supplier.
        ...(supplierScope ? {} : { supplierId: String(formData.get("supplierId") ?? "").trim() || null }),
      },
    });
  } catch (e) {
    return { ok: false, error: toUserMessage(e) };
  }

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/portal/products");
  revalidatePath(`/portal/products/${id}`);
  revalidatePath("/shop");
  redirect(`${homeFor(supplierScope)}/${id}`);
}

/**
 * Delete a product. If it has any history (stock movements, sale or PO lines)
 * we soft-delete (deactivate) so referential history is preserved; otherwise we
 * hard-delete the row.
 */
export async function deleteProduct(id: string): Promise<ActionResult> {
  const auth = await checkProductManager();
  if ("error" in auth) return { ok: false, error: auth.error };
  const { supplierScope } = auth;

  try {
    await loadOwn(id, supplierScope);

    const refs = await prisma.product.findUnique({
      where: { id },
      select: {
        _count: { select: { movements: true, saleItems: true, poItems: true } },
      },
    });
    const hasHistory =
      !!refs &&
      (refs._count.movements > 0 ||
        refs._count.saleItems > 0 ||
        refs._count.poItems > 0);

    if (hasHistory) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.product.delete({ where: { id } });
    }
  } catch (e) {
    return { ok: false, error: toUserMessage(e, "Failed to delete.") };
  }

  revalidatePath("/products");
  revalidatePath("/portal/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true };
}
