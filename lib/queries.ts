import { prisma } from "@/lib/db";
import type { MovementType, Product } from "@/lib/types";

// Server-side data access. Each function returns plain, serializable objects
// (Prisma Decimals converted to numbers) so they can pass straight into Server
// and Client Components. This is the single seam the UI depends on — it
// replaces the former in-memory mock layer.

export type ProductRow = Product & {
  categoryName: string | null;
  supplierName: string | null;
};

export type MovementView = {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  createdBy: string;
  createdAt: string;
};

type ProductWithRelations = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  supplierId: string | null;
  costPrice: { toString(): string };
  sellPrice: { toString(): string };
  quantityOnHand: number;
  reorderPoint: number;
  unit: string;
  isActive: boolean;
  updatedAt: Date;
  category?: { name: string } | null;
  supplier?: { name: string } | null;
};

function toRow(p: ProductWithRelations): ProductRow {
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode ?? undefined,
    name: p.name,
    description: p.description ?? undefined,
    categoryId: p.categoryId ?? "",
    supplierId: p.supplierId ?? "",
    costPrice: Number(p.costPrice),
    sellPrice: Number(p.sellPrice),
    quantityOnHand: p.quantityOnHand,
    reorderPoint: p.reorderPoint,
    unit: p.unit,
    isActive: p.isActive,
    updatedAt: p.updatedAt.toISOString(),
    categoryName: p.category?.name ?? null,
    supplierName: p.supplier?.name ?? null,
  };
}

export async function getProducts(opts: {
  q?: string;
  category?: string;
  filter?: string;
}): Promise<ProductRow[]> {
  const query = (opts.q ?? "").trim();
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(opts.category ? { categoryId: opts.category } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
              { barcode: { contains: query } },
            ],
          }
        : {}),
    },
    include: { category: true, supplier: true },
    orderBy: { name: "asc" },
  });

  let rows = products.map(toRow);
  if (opts.filter === "low") {
    rows = rows.filter(
      (p) =>
        p.quantityOnHand <= 0 ||
        (p.reorderPoint > 0 && p.quantityOnHand <= p.reorderPoint),
    );
  }
  return rows;
}

export async function getActiveProductCount(): Promise<number> {
  return prisma.product.count({ where: { isActive: true } });
}

export async function getProductDetail(id: string): Promise<{
  product: ProductRow;
  movements: MovementView[];
} | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, supplier: true },
  });
  if (!product) return null;

  const movements = await prisma.stockMovement.findMany({
    where: { productId: id },
    include: { product: { select: { name: true } }, createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    product: toRow(product),
    movements: movements.map(toMovementView),
  };
}

function toMovementView(m: {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  createdAt: Date;
  product?: { name: string } | null;
  createdBy?: { name: string } | null;
}): MovementView {
  return {
    id: m.id,
    productId: m.productId,
    productName: m.product?.name ?? "Unknown product",
    type: m.type,
    quantity: m.quantity,
    reason: m.reason,
    createdBy: m.createdBy?.name ?? "—",
    createdAt: m.createdAt.toISOString(),
  };
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getSuppliersBasic() {
  return prisma.supplier.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function getRecentMovements(limit = 6): Promise<MovementView[]> {
  const movements = await prisma.stockMovement.findMany({
    include: { product: { select: { name: true } }, createdBy: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return movements.map(toMovementView);
}

export type DashboardData = {
  activeCount: number;
  stockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  attention: ProductRow[];
  recent: MovementView[];
};

export async function getDashboardData(): Promise<DashboardData> {
  const products = (
    await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, supplier: true },
      orderBy: { name: "asc" },
    })
  ).map(toRow);

  const stockValue = products.reduce(
    (sum, p) => sum + p.quantityOnHand * p.costPrice,
    0,
  );
  const outOfStock = products.filter((p) => p.quantityOnHand <= 0);
  const lowStock = products.filter(
    (p) =>
      p.quantityOnHand > 0 &&
      p.reorderPoint > 0 &&
      p.quantityOnHand <= p.reorderPoint,
  );

  return {
    activeCount: products.length,
    stockValue,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    attention: [...outOfStock, ...lowStock].slice(0, 6),
    recent: await getRecentMovements(6),
  };
}

export async function getSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    productCount: s._count.products,
  }));
}
