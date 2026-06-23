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
 * Apply a single stock movement inside an existing transaction: update the
 * cached Product.quantityOnHand and record the StockMovement. Returns the new
 * on-hand quantity.
 *
 * Stock changes are applied with a single atomic conditional UPDATE rather than
 * read-then-write, so concurrent orders cannot oversell or drive quantity below
 * zero (no negative stock, SPEC §4). For a decrement we guard with
 * `quantityOnHand >= |delta|` in the WHERE clause: if the row no longer
 * qualifies (another transaction got there first) the update matches zero rows
 * and we reject — there is no lost-update window.
 */
export async function applyMovement(
  tx: Tx,
  input: MovementInput,
): Promise<number> {
  const delta = input.quantity;

  if (delta < 0) {
    const need = -delta;
    const res = await tx.product.updateMany({
      where: { id: input.productId, quantityOnHand: { gte: need } },
      data: { quantityOnHand: { decrement: need } },
    });
    if (res.count === 0) {
      // Either the product is gone or there isn't enough stock. Read it back to
      // produce a precise, user-facing error message.
      const product = await tx.product.findUnique({
        where: { id: input.productId },
        select: { quantityOnHand: true, name: true },
      });
      if (!product) throw new Error("Product not found.");
      throw new Error(
        `Not enough stock for ${product.name}: ${product.quantityOnHand} on hand, ` +
          `cannot remove ${need}.`,
      );
    }
  } else if (delta > 0) {
    const res = await tx.product.updateMany({
      where: { id: input.productId },
      data: { quantityOnHand: { increment: delta } },
    });
    if (res.count === 0) throw new Error("Product not found.");
  }

  await tx.stockMovement.create({
    data: {
      productId: input.productId,
      type: input.type,
      quantity: delta,
      reason: input.reason ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      unitCost: input.unitCost ?? null,
      createdById: input.createdById ?? null,
    },
  });

  const after = await tx.product.findUnique({
    where: { id: input.productId },
    select: { quantityOnHand: true },
  });
  return after?.quantityOnHand ?? 0;
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
