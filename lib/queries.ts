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

// --- Product picker (for PO / Sale line-item editors) ---

export type PickerProduct = {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  sellPrice: number;
  quantityOnHand: number;
};

export async function getPickerProducts(): Promise<PickerProduct[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      costPrice: true,
      sellPrice: true,
      quantityOnHand: true,
    },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    costPrice: Number(p.costPrice),
    sellPrice: Number(p.sellPrice),
    quantityOnHand: p.quantityOnHand,
  }));
}

// --- Purchase Orders ---

export async function getPurchaseOrders() {
  const pos = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true, _count: { select: { items: true } } },
  });
  return pos.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    supplierName: po.supplier.name,
    status: po.status,
    itemCount: po._count.items,
    createdAt: po.createdAt.toISOString(),
  }));
}

export async function getPurchaseOrder(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { supplier: true, items: { include: { product: true } } },
  });
  if (!po) return null;
  const items = po.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    productName: i.product.name,
    sku: i.product.sku,
    quantity: i.quantity,
    unitCost: Number(i.unitCost),
    lineTotal: i.quantity * Number(i.unitCost),
  }));
  return {
    id: po.id,
    poNumber: po.poNumber,
    supplierName: po.supplier.name,
    status: po.status,
    notes: po.notes,
    orderedAt: po.orderedAt?.toISOString() ?? null,
    receivedAt: po.receivedAt?.toISOString() ?? null,
    createdAt: po.createdAt.toISOString(),
    items,
    total: items.reduce((s, i) => s + i.lineTotal, 0),
  };
}

// --- Sales ---

export async function getSales() {
  const sales = await prisma.sale.findMany({
    orderBy: { soldAt: "desc" },
    include: { items: true },
  });
  return sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    customerName: s.customerName,
    status: s.status,
    itemCount: s.items.length,
    total: s.items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0),
    soldAt: s.soldAt.toISOString(),
  }));
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });
  if (!sale) return null;
  const items = sale.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    productName: i.product.name,
    sku: i.product.sku,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    lineTotal: i.quantity * Number(i.unitPrice),
  }));
  return {
    id: sale.id,
    saleNumber: sale.saleNumber,
    customerName: sale.customerName,
    status: sale.status,
    notes: sale.notes,
    soldAt: sale.soldAt.toISOString(),
    items,
    total: items.reduce((s, i) => s + i.lineTotal, 0),
  };
}

// --- Reports ---

export type ValuationRow = {
  id: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  costPrice: number;
  sellPrice: number;
  costValue: number;
  retailValue: number;
};

export async function getValuationReport() {
  const products = (
    await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        quantityOnHand: true,
        costPrice: true,
        sellPrice: true,
      },
    })
  ).map((p) => {
    const costPrice = Number(p.costPrice);
    const sellPrice = Number(p.sellPrice);
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      quantityOnHand: p.quantityOnHand,
      costPrice,
      sellPrice,
      costValue: p.quantityOnHand * costPrice,
      retailValue: p.quantityOnHand * sellPrice,
    };
  });

  const totalCost = products.reduce((s, p) => s + p.costValue, 0);
  const totalRetail = products.reduce((s, p) => s + p.retailValue, 0);
  const totalUnits = products.reduce((s, p) => s + p.quantityOnHand, 0);
  return { rows: products, totalCost, totalRetail, totalUnits };
}

// --- Share Links ---

export async function getShareLinks() {
  const links = await prisma.shareLink.findMany({
    orderBy: { createdAt: "desc" },
  });
  return links.map((l) => ({
    id: l.id,
    token: l.token,
    title: l.title,
    scope: l.scope,
    isActive: l.isActive,
    createdAt: l.createdAt.toISOString(),
  }));
}

// --- Supplier portal (scoped to one supplier) ---

export async function getSupplierOrders(supplierId: string) {
  const pos = await prisma.purchaseOrder.findMany({
    where: { supplierId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return pos.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    itemCount: po._count.items,
    createdAt: po.createdAt.toISOString(),
  }));
}

export async function getSupplierOrder(id: string, supplierId: string) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id, supplierId },
    include: { items: { include: { product: true } } },
  });
  if (!po) return null;
  const items = po.items.map((i) => ({
    id: i.id,
    productName: i.product.name,
    sku: i.product.sku,
    quantity: i.quantity,
    unitCost: Number(i.unitCost),
    lineTotal: i.quantity * Number(i.unitCost),
  }));
  return {
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    notes: po.notes,
    receivedAt: po.receivedAt?.toISOString() ?? null,
    createdAt: po.createdAt.toISOString(),
    items,
    total: items.reduce((s, i) => s + i.lineTotal, 0),
  };
}

// --- Customer storefront ---

export async function getShopProducts(): Promise<ProductRow[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { category: true, supplier: true },
  });
  return products.map(toRow);
}

export async function getCustomerOrders(userId: string) {
  const sales = await prisma.sale.findMany({
    where: { customerUserId: userId },
    orderBy: { soldAt: "desc" },
    include: { items: true },
  });
  return sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    status: s.status,
    itemCount: s.items.length,
    total: s.items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0),
    soldAt: s.soldAt.toISOString(),
  }));
}

export async function getCustomerOrder(id: string, userId: string) {
  const sale = await prisma.sale.findFirst({
    where: { id, customerUserId: userId },
    include: { items: { include: { product: true } } },
  });
  if (!sale) return null;
  const items = sale.items.map((i) => ({
    id: i.id,
    productName: i.product.name,
    sku: i.product.sku,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    lineTotal: i.quantity * Number(i.unitPrice),
  }));
  return {
    id: sale.id,
    saleNumber: sale.saleNumber,
    status: sale.status,
    soldAt: sale.soldAt.toISOString(),
    items,
    total: items.reduce((s, i) => s + i.lineTotal, 0),
  };
}

export async function getShareSnapshot(token: string) {
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link || !link.isActive) return null;
  if (link.expiresAt && link.expiresAt < new Date()) return null;

  const where: { isActive: boolean; categoryId?: string } = { isActive: true };
  if (link.scope === "CATEGORY" && link.categoryId) {
    where.categoryId = link.categoryId;
  }

  let products = (
    await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: { category: true },
    })
  ).map(toRow);

  if (link.scope === "LOW_STOCK") {
    products = products.filter(
      (p) =>
        p.quantityOnHand <= 0 ||
        (p.reorderPoint > 0 && p.quantityOnHand <= p.reorderPoint),
    );
  }

  return {
    title: link.title,
    scope: link.scope,
    products,
  };
}
