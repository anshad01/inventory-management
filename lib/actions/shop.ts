"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { applyMovement, nextDocNumber } from "@/lib/services/stock";
import { requireCustomer } from "@/lib/auth/session";

type CartLine = { id: string; qty: number };

export type CheckoutResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

/** Customer checkout: turns the cart into a completed Sale (SALE_OUT movements
 * that draw down stock). Prices are taken from the DB, not the client. */
export async function checkout(lines: CartLine[]): Promise<CheckoutResult> {
  const user = await requireCustomer();

  const wanted = lines
    .map((l) => ({ id: String(l.id), qty: Math.max(0, Math.floor(Number(l.qty) || 0)) }))
    .filter((l) => l.id && l.qty > 0);
  if (wanted.length === 0) return { ok: false, error: "Your cart is empty." };

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      // Re-read products to price the order server-side (never trust client prices).
      const products = await tx.product.findMany({
        where: { id: { in: wanted.map((w) => w.id) }, isActive: true },
        select: { id: true, sellPrice: true },
      });
      const priceById = new Map(products.map((p) => [p.id, Number(p.sellPrice)]));

      const saleNumber = await nextDocNumber("SALE");
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          customerName: user.name,
          customerUserId: user.id,
          status: "COMPLETED",
          createdById: user.id,
          items: {
            create: wanted.map((w) => ({
              productId: w.id,
              quantity: w.qty,
              unitPrice: priceById.get(w.id) ?? 0,
            })),
          },
        },
      });

      for (const w of wanted) {
        await applyMovement(tx, {
          productId: w.id,
          type: "SALE_OUT",
          quantity: -w.qty,
          reason: `Online order ${saleNumber}`,
          referenceType: "SALE",
          referenceId: sale.id,
          createdById: user.id,
        });
      }
      return sale.id;
    });

    revalidatePath("/shop");
    revalidatePath("/products");
    revalidatePath("/products/[id]", "page");
    revalidatePath("/");
    return { ok: true, orderId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Checkout failed." };
  }
}
