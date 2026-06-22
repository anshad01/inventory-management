import type {
  Category,
  Product,
  StockMovement,
  Supplier,
} from "@/lib/types";

// In-memory demo dataset for a small retail shop. This is the temporary data
// source for the UI-first build; it will be replaced by Prisma queries against
// Postgres (see SPEC.md §9, M2) without changing the consuming components.

export const categories: Category[] = [
  { id: "cat_beverages", name: "Beverages" },
  { id: "cat_snacks", name: "Snacks" },
  { id: "cat_household", name: "Household" },
  { id: "cat_personal", name: "Personal Care" },
  { id: "cat_stationery", name: "Stationery" },
];

export const suppliers: Supplier[] = [
  { id: "sup_acme", name: "Acme Distribution", email: "orders@acme.example" },
  { id: "sup_fresh", name: "FreshLine Foods", email: "sales@freshline.example" },
  { id: "sup_clean", name: "CleanCo Supplies", email: "hello@cleanco.example" },
  { id: "sup_paper", name: "PaperWorks Ltd", email: "info@paperworks.example" },
];

export const products: Product[] = [
  {
    id: "p_001",
    sku: "BEV-COLA-330",
    barcode: "8901234500017",
    name: "Cola Classic 330ml",
    description: "Carbonated soft drink, single can.",
    categoryId: "cat_beverages",
    supplierId: "sup_acme",
    costPrice: 0.45,
    sellPrice: 0.99,
    quantityOnHand: 240,
    reorderPoint: 60,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-20T09:12:00Z",
  },
  {
    id: "p_002",
    sku: "BEV-WATER-1L",
    barcode: "8901234500024",
    name: "Spring Water 1L",
    categoryId: "cat_beverages",
    supplierId: "sup_fresh",
    costPrice: 0.3,
    sellPrice: 0.79,
    quantityOnHand: 48,
    reorderPoint: 50,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-21T14:30:00Z",
  },
  {
    id: "p_003",
    sku: "SNK-CHIPS-150",
    barcode: "8901234500031",
    name: "Potato Chips Salted 150g",
    categoryId: "cat_snacks",
    supplierId: "sup_fresh",
    costPrice: 0.8,
    sellPrice: 1.75,
    quantityOnHand: 12,
    reorderPoint: 30,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-22T08:05:00Z",
  },
  {
    id: "p_004",
    sku: "SNK-CHOCO-50",
    barcode: "8901234500048",
    name: "Milk Chocolate Bar 50g",
    categoryId: "cat_snacks",
    supplierId: "sup_acme",
    costPrice: 0.55,
    sellPrice: 1.2,
    quantityOnHand: 0,
    reorderPoint: 25,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-19T11:45:00Z",
  },
  {
    id: "p_005",
    sku: "HSE-DISH-500",
    barcode: "8901234500055",
    name: "Dish Soap 500ml",
    categoryId: "cat_household",
    supplierId: "sup_clean",
    costPrice: 1.1,
    sellPrice: 2.49,
    quantityOnHand: 85,
    reorderPoint: 20,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-18T16:20:00Z",
  },
  {
    id: "p_006",
    sku: "HSE-TOWEL-2PK",
    barcode: "8901234500062",
    name: "Paper Towels 2-pack",
    categoryId: "cat_household",
    supplierId: "sup_paper",
    costPrice: 1.4,
    sellPrice: 3.25,
    quantityOnHand: 18,
    reorderPoint: 24,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-22T07:10:00Z",
  },
  {
    id: "p_007",
    sku: "PRS-SHAMP-250",
    barcode: "8901234500079",
    name: "Shampoo Everyday 250ml",
    categoryId: "cat_personal",
    supplierId: "sup_clean",
    costPrice: 1.8,
    sellPrice: 3.99,
    quantityOnHand: 64,
    reorderPoint: 15,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-17T13:00:00Z",
  },
  {
    id: "p_008",
    sku: "PRS-SOAP-100",
    barcode: "8901234500086",
    name: "Bar Soap Lavender 100g",
    categoryId: "cat_personal",
    supplierId: "sup_clean",
    costPrice: 0.5,
    sellPrice: 1.15,
    quantityOnHand: 132,
    reorderPoint: 40,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-16T10:25:00Z",
  },
  {
    id: "p_009",
    sku: "STN-PEN-BLU",
    barcode: "8901234500093",
    name: "Ballpoint Pen Blue",
    categoryId: "cat_stationery",
    supplierId: "sup_paper",
    costPrice: 0.12,
    sellPrice: 0.45,
    quantityOnHand: 9,
    reorderPoint: 50,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-21T09:55:00Z",
  },
  {
    id: "p_010",
    sku: "STN-NOTE-A5",
    barcode: "8901234500109",
    name: "Notebook A5 80pg",
    categoryId: "cat_stationery",
    supplierId: "sup_paper",
    costPrice: 0.9,
    sellPrice: 2.2,
    quantityOnHand: 54,
    reorderPoint: 20,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-15T15:40:00Z",
  },
  {
    id: "p_011",
    sku: "BEV-JUICE-1L",
    barcode: "8901234500116",
    name: "Orange Juice 1L",
    categoryId: "cat_beverages",
    supplierId: "sup_fresh",
    costPrice: 1.2,
    sellPrice: 2.75,
    quantityOnHand: 27,
    reorderPoint: 30,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-22T06:30:00Z",
  },
  {
    id: "p_012",
    sku: "HSE-TRASH-30",
    barcode: "8901234500123",
    name: "Trash Bags 30L (20ct)",
    categoryId: "cat_household",
    supplierId: "sup_clean",
    costPrice: 1.0,
    sellPrice: 2.6,
    quantityOnHand: 73,
    reorderPoint: 25,
    unit: "pcs",
    isActive: true,
    updatedAt: "2026-06-14T12:15:00Z",
  },
];

export const movements: StockMovement[] = [
  { id: "m_001", productId: "p_001", type: "PURCHASE_IN", quantity: 120, createdBy: "Priya", createdAt: "2026-06-20T09:12:00Z" },
  { id: "m_002", productId: "p_003", type: "SALE_OUT", quantity: -18, createdBy: "Sam", createdAt: "2026-06-22T08:05:00Z" },
  { id: "m_003", productId: "p_006", type: "SALE_OUT", quantity: -6, createdBy: "Sam", createdAt: "2026-06-22T07:10:00Z" },
  { id: "m_004", productId: "p_004", type: "SALE_OUT", quantity: -25, createdBy: "Priya", createdAt: "2026-06-19T11:45:00Z" },
  { id: "m_005", productId: "p_011", type: "ADJUSTMENT", quantity: -3, reason: "Damaged in transit", createdBy: "Priya", createdAt: "2026-06-22T06:30:00Z" },
  { id: "m_006", productId: "p_009", type: "SALE_OUT", quantity: -41, createdBy: "Sam", createdAt: "2026-06-21T09:55:00Z" },
  { id: "m_007", productId: "p_002", type: "SALE_OUT", quantity: -12, createdBy: "Sam", createdAt: "2026-06-21T14:30:00Z" },
  { id: "m_008", productId: "p_007", type: "PURCHASE_IN", quantity: 50, createdBy: "Priya", createdAt: "2026-06-17T13:00:00Z" },
  { id: "m_009", productId: "p_005", type: "PURCHASE_IN", quantity: 60, createdBy: "Priya", createdAt: "2026-06-18T16:20:00Z" },
  { id: "m_010", productId: "p_008", type: "SALE_OUT", quantity: -8, createdBy: "Sam", createdAt: "2026-06-16T10:25:00Z" },
];

// --- Lookups & derived helpers (server-side; pure functions) ---

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}

export function getSupplier(id: string) {
  return suppliers.find((s) => s.id === id);
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getProductMovements(productId: string) {
  return movements
    .filter((m) => m.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRecentMovements(limit = 6) {
  return [...movements]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
