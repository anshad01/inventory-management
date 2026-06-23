// Domain types — mirror the Prisma models defined in SPEC.md §3.
// The UI is built against these so the data source can later switch from
// mock data to Prisma/Postgres without changing components.

export type Role = "ADMIN" | "STAFF" | "VIEWER";

// Result shape returned by mutating Server Actions that report errors to the UI.
export type ActionResult = { ok: true } | { ok: false; error: string };

export type MovementType = "PURCHASE_IN" | "SALE_OUT" | "ADJUSTMENT";

export interface Category {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  supplierId: string;
  costPrice: number;
  sellPrice: number;
  quantityOnHand: number;
  reorderPoint: number;
  unit: string;
  isActive: boolean;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number; // signed: + adds stock, - removes
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export function stockStatus(product: Product): StockStatus {
  if (product.quantityOnHand <= 0) return "out_of_stock";
  if (product.reorderPoint > 0 && product.quantityOnHand <= product.reorderPoint)
    return "low_stock";
  return "in_stock";
}
