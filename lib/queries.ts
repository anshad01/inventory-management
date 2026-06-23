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
  imageUrl: string | null;
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
    imageUrl: p.imageUrl ?? null,
    updatedAt: p.updatedAt.toISOString(),
    categoryName: p.category?.name ?? null,
    supplierName: p.supplier?.name ?? null,
  };
}

export async function getProducts(opts: {
  q?: string;
  category?: string;
  filter?: string;
  page?: number;
  perPage?: number;
}): Promise<{ rows: ProductRow[]; total: number; page: number; pageCount: number }> {
  const perPage = opts.perPage ?? 12;
  const page = Math.max(1, opts.page ?? 1);
  const query = (opts.q ?? "").trim();
  const where = {
    isActive: true,
    ...(opts.category ? { categoryId: opts.category } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { sku: { contains: query, mode: "insensitive" as const } },
            { barcode: { contains: query } },
          ],
        }
      : {}),
  };

  // The low-stock filter compares two columns, which Prisma can't express in a
  // WHERE clause, so it's applied (and paginated) in memory. The normal listing
  // paginates at the database.
  if (opts.filter === "low") {
    const all = (
      await prisma.product.findMany({
        where,
        include: { category: true, supplier: true },
        orderBy: { name: "asc" },
      })
    )
      .map(toRow)
      .filter(
        (p) =>
          p.quantityOnHand <= 0 ||
          (p.reorderPoint > 0 && p.quantityOnHand <= p.reorderPoint),
      );
    const total = all.length;
    return {
      rows: all.slice((page - 1) * perPage, page * perPage),
      total,
      page,
      pageCount: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true, supplier: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    rows: products.map(toRow),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
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

// --- Users (admin) ---

export type UserRow = {
  id: string;
  name: string;
  email: string;
  type: string;
  role: string;
  supplierName: string | null;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
};

export async function getUsers(): Promise<UserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    include: { supplier: { select: { name: true } } },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    type: u.type,
    role: u.role,
    supplierName: u.supplier?.name ?? null,
    isActive: u.isActive,
    isApproved: u.isApproved,
    createdAt: u.createdAt.toISOString(),
  }));
}

// --- Notifications ---

export type NotificationView = {
  id: string;
  type: string;
  message: string;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

export async function getNotifications(
  userId: string,
  limit = 12,
): Promise<{ items: NotificationView[]; unread: number }> {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return {
    items: rows.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      href: n.href,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    unread,
  };
}

// --- Sales analytics (admin dashboard aggregates, SPEC §6) ---

export type SalesReport = {
  totalRevenue: number;
  orderCount: number;
  ordersToday: number;
  perDay: { date: string; orders: number; revenue: number }[];
  bySupplier: { supplier: string; revenue: number; units: number }[];
};

/** Aggregates over non-cancelled sales: revenue totals, orders per day for the
 * last 7 days, and revenue per supplier. */
export async function getSalesReport(): Promise<SalesReport> {
  const sales = await prisma.sale.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { items: { include: { product: { include: { supplier: true } } } } },
    orderBy: { soldAt: "desc" },
  });

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const todayKey = dayKey(new Date());

  let totalRevenue = 0;
  let ordersToday = 0;
  const perDayMap = new Map<string, { orders: number; revenue: number }>();
  const supplierMap = new Map<string, { revenue: number; units: number }>();

  // Seed the last 7 days so quiet days still show as zero.
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    perDayMap.set(dayKey(d), { orders: 0, revenue: 0 });
  }

  for (const sale of sales) {
    const orderTotal = sale.items.reduce(
      (s, i) => s + i.quantity * Number(i.unitPrice),
      0,
    );
    totalRevenue += orderTotal;

    const key = dayKey(sale.soldAt);
    if (key === todayKey) ordersToday += 1;
    if (perDayMap.has(key)) {
      const bucket = perDayMap.get(key)!;
      bucket.orders += 1;
      bucket.revenue += orderTotal;
    }

    for (const item of sale.items) {
      const name = item.product.supplier?.name ?? "Unassigned";
      const bucket = supplierMap.get(name) ?? { revenue: 0, units: 0 };
      bucket.revenue += item.quantity * Number(item.unitPrice);
      bucket.units += item.quantity;
      supplierMap.set(name, bucket);
    }
  }

  return {
    totalRevenue,
    orderCount: sales.length,
    ordersToday,
    perDay: [...perDayMap.entries()].map(([date, v]) => ({ date, ...v })),
    bySupplier: [...supplierMap.entries()]
      .map(([supplier, v]) => ({ supplier, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}

/** Flat order rows for CSV export. */
export async function getOrdersForExport() {
  const sales = await prisma.sale.findMany({
    orderBy: { soldAt: "desc" },
    include: { items: true },
  });
  return sales.map((s) => ({
    saleNumber: s.saleNumber,
    customer: s.customerName ?? "",
    status: s.status,
    items: s.items.reduce((n, i) => n + i.quantity, 0),
    total: s.items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0),
    soldAt: s.soldAt.toISOString(),
  }));
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

export async function getSupplierProducts(supplierId: string): Promise<ProductRow[]> {
  const products = await prisma.product.findMany({
    where: { supplierId, isActive: true },
    include: { category: true, supplier: true },
    orderBy: { name: "asc" },
  });
  return products.map(toRow);
}

export async function getSupplierProduct(
  id: string,
  supplierId: string,
): Promise<ProductRow | null> {
  const product = await prisma.product.findFirst({
    where: { id, supplierId },
    include: { category: true, supplier: true },
  });
  return product ? toRow(product) : null;
}

// --- Customer storefront ---

export type ShopFilters = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  perPage?: number;
};

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export async function getShopProducts(
  opts: ShopFilters = {},
): Promise<Paged<ProductRow>> {
  const perPage = opts.perPage ?? 9;
  const page = Math.max(1, opts.page ?? 1);
  const query = (opts.q ?? "").trim();

  const where: Record<string, unknown> = { isActive: true };
  if (opts.category) where.categoryId = opts.category;
  if (opts.inStock) where.quantityOnHand = { gt: 0 };
  if (opts.minPrice != null || opts.maxPrice != null) {
    where.sellPrice = {
      ...(opts.minPrice != null ? { gte: opts.minPrice } : {}),
      ...(opts.maxPrice != null ? { lte: opts.maxPrice } : {}),
    };
  }
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: { category: true, supplier: true },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    rows: products.map(toRow),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
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
