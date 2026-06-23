import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;
type DB = Tx | typeof prisma;

type NotificationType = "ORDER_STATUS" | "LOW_STOCK" | "SUPPLIER_APPROVAL";

/** Create an in-app notification for a single user (no external email/SMS — it
 * surfaces inside the app via the bell menu). Safe to call inside or outside a
 * transaction. */
export async function notify(
  db: DB,
  input: {
    userId: string;
    type: NotificationType;
    message: string;
    href?: string | null;
  },
): Promise<void> {
  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      message: input.message,
      href: input.href ?? null,
    },
  });
}

/** After a stock-affecting change, alert the relevant people if a product has
 * fallen to or below its reorder point: all active STAFF plus the SUPPLIER
 * account(s) linked to the product's supplier. Best-effort and de-duplicated by
 * checking the current quantity, so it only fires on the crossing. */
export async function notifyLowStock(
  db: DB,
  productId: string,
): Promise<void> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      quantityOnHand: true,
      reorderPoint: true,
      supplierId: true,
    },
  });
  if (!product) return;

  const isLow =
    product.quantityOnHand <= 0 ||
    (product.reorderPoint > 0 && product.quantityOnHand <= product.reorderPoint);
  if (!isLow) return;

  const recipients = await db.user.findMany({
    where: {
      isActive: true,
      OR: [
        { type: "STAFF" },
        ...(product.supplierId
          ? [{ type: "SUPPLIER" as const, supplierId: product.supplierId }]
          : []),
      ],
    },
    select: { id: true },
  });

  const message =
    product.quantityOnHand <= 0
      ? `${product.name} is out of stock.`
      : `${product.name} is low on stock (${product.quantityOnHand} left).`;

  for (const r of recipients) {
    await notify(db, {
      userId: r.id,
      type: "LOW_STOCK",
      message,
      href: `/products/${productId}`,
    });
  }
}
