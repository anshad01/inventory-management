import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type MovementInput = {
  productId: string;
  type: "PURCHASE_IN" | "SALE_OUT" | "ADJUSTMENT";
  quantity: number; // signed: + adds stock, - removes
  reason?: string | null;
  referenceType?: "PURCHASE_ORDER" | "SALE" | "MANUAL" | null;
  referenceId?: string | null;
  unitCost?: number | null;
  createdById?: string | null;
};

/**
 * Apply a single stock movement inside an existing transaction: record the
 * StockMovement and update the cached Product.quantityOnHand. Rejects changes
 * that would drive quantity below zero (no negative stock, SPEC §4).
 * Returns the new on-hand quantity.
 */
export async function applyMovement(
  tx: Tx,
  input: MovementInput,
): Promise<number> {
  const product = await tx.product.findUnique({
    where: { id: input.productId },
    select: { quantityOnHand: true, name: true },
  });
  if (!product) throw new Error("Product not found.");

  const next = product.quantityOnHand + input.quantity;
  if (next < 0) {
    throw new Error(
      `Not enough stock for ${product.name}: ${product.quantityOnHand} on hand, ` +
        `cannot remove ${Math.abs(input.quantity)}.`,
    );
  }

  await tx.stockMovement.create({
    data: {
      productId: input.productId,
      type: input.type,
      quantity: input.quantity,
      reason: input.reason ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      unitCost: input.unitCost ?? null,
      createdById: input.createdById ?? null,
    },
  });

  await tx.product.update({
    where: { id: input.productId },
    data: { quantityOnHand: next },
  });

  return next;
}

/** Generate the next sequential document number, e.g. PO-0007 / SALE-0012. */
export async function nextDocNumber(
  kind: "PO" | "SALE",
): Promise<string> {
  const count =
    kind === "PO"
      ? await prisma.purchaseOrder.count()
      : await prisma.sale.count();
  return `${kind}-${String(count + 1).padStart(4, "0")}`;
}
