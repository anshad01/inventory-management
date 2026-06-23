"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { applyMovement } from "@/lib/services/stock";
import { notifyLowStock } from "@/lib/services/notify";
import { checkWriter, requireWriter } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/types";

// Server Actions = the write side of the backend. All stock changes go through
// applyMovement so Product.quantityOnHand stays a transactional cache of the
// movement history — quantity is never edited directly (SPEC.md §4).
// Product create/edit/delete live in lib/actions/products.ts.

/** Record a manual stock adjustment and update the cached quantity. */
export async function adjustStock(
  productId: string,
  delta: number,
  reason?: string,
): Promise<ActionResult> {
  const auth = await checkWriter();
  if ("error" in auth) return { ok: false, error: auth.error };

  if (!Number.isInteger(delta) || delta === 0) {
    return { ok: false, error: "Enter a non-zero whole number." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await applyMovement(tx, {
        productId,
        type: "ADJUSTMENT",
        quantity: delta,
        reason: reason?.trim() || null,
        referenceType: "MANUAL",
        createdById: auth.user.id,
      });
      await notifyLowStock(tx, productId);
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed." };
  }

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

/** Create a supplier. */
export async function createSupplier(formData: FormData) {
  await requireWriter();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!name) throw new Error("Supplier name is required.");

  await prisma.supplier.create({ data: { name, email, phone } });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}
