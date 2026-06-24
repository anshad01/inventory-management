import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

// All demo accounts share this password (shown on the login screen).
const DEMO_PASSWORD = "password123";

// Demo dataset for a computer-peripherals store. Ids are explicit and stable so
// URLs and tests stay predictable. This seed is the source of truth for local
// development data (replaces the earlier in-memory mock layer).

const users = [
  { id: "u_priya", email: "priya@inventory.example", name: "Priya Anand", type: "STAFF" as const, role: "ADMIN" as const, supplierId: null, isApproved: true },
  { id: "u_sam", email: "sam@inventory.example", name: "Sam Lee", type: "STAFF" as const, role: "STAFF" as const, supplierId: null, isApproved: true },
  { id: "u_vee", email: "viewer@inventory.example", name: "Vee Viewer", type: "STAFF" as const, role: "VIEWER" as const, supplierId: null, isApproved: true },
  { id: "u_supplier", email: "supplier@techsource.example", name: "Taylor (TechSource)", type: "SUPPLIER" as const, role: "VIEWER" as const, supplierId: "sup_techsource", isApproved: true },
  { id: "u_supplier2", email: "newsupplier@pericore.example", name: "Robin (PeriCore)", type: "SUPPLIER" as const, role: "VIEWER" as const, supplierId: "sup_pericore", isApproved: false },
  { id: "u_customer", email: "customer@example.com", name: "Jordan Smith", type: "CUSTOMER" as const, role: "VIEWER" as const, supplierId: null, isApproved: true },
];

// Real product photos (Unsplash CDN). Each id below was verified to resolve;
// the `u()` helper applies consistent sizing/format params. If a product has no
// specific photo we fall back to the category SVG, then a generic placeholder —
// so the catalog always renders something sensible even offline.
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const productImage: Record<string, string> = {
  p_001: u("1587829741301-dc798b83add3"), // mechanical keyboard
  p_002: u("1618384887929-16ec33fab9ef"), // slim wireless keyboard
  p_003: u("1527814050087-3793815479db"), // wireless mouse
  p_004: u("1615663245857-ac93bb7c39e7"), // RGB gaming mouse
  p_005: u("1527443224154-c4a3942d3acf"), // QHD monitor
  p_006: u("1517336714731-489689fd1ca8"), // FHD monitor
  p_007: u("1599669454699-248893623440"), // USB headset
  p_008: u("1618366712010-f4ae9c647dcb"), // wireless headset
  p_009: u("1623949556303-b0d17d198863"), // webcam
  p_010: u("1531492746076-161ca9bcad58"), // portable SSD
  p_011: u("1625842268584-8f3296236761"), // USB-C hub
  p_012: u("1558618666-fcd25c85cd64"), //   HDMI cable
};

// Category-level SVG fallbacks (bundled locally, always available).
const categoryImage: Record<string, string> = {
  cat_keyboards: "/img/categories/keyboards.svg",
  cat_mice: "/img/categories/mice.svg",
  cat_monitors: "/img/categories/monitors.svg",
  cat_audio: "/img/categories/headsets.svg",
  cat_webcams: "/img/categories/webcams.svg",
  cat_storage: "/img/categories/storage.svg",
  cat_cables: "/img/categories/cables.svg",
  cat_docks: "/img/categories/docks.svg",
};

const categories = [
  { id: "cat_keyboards", name: "Keyboards" },
  { id: "cat_mice", name: "Mice" },
  { id: "cat_monitors", name: "Monitors" },
  { id: "cat_audio", name: "Headsets" },
  { id: "cat_webcams", name: "Webcams" },
  { id: "cat_storage", name: "Storage" },
  { id: "cat_cables", name: "Cables & Adapters" },
  { id: "cat_docks", name: "Docks & Hubs" },
];

const suppliers = [
  { id: "sup_techsource", name: "TechSource Distribution", email: "orders@techsource.example" },
  { id: "sup_pericore", name: "PeriCore Supplies", email: "sales@pericore.example" },
  { id: "sup_nexus", name: "NexusParts", email: "hello@nexusparts.example" },
  { id: "sup_cablehub", name: "CableHub Ltd", email: "info@cablehub.example" },
];

const products = [
  { id: "p_001", sku: "KBD-MECH-87", barcode: "0850001000017", name: "Mechanical Keyboard TKL", description: "Tenkeyless mechanical keyboard, hot-swappable brown switches.", categoryId: "cat_keyboards", supplierId: "sup_pericore", costPrice: 38.0, sellPrice: 79.99, quantityOnHand: 64, reorderPoint: 20 },
  { id: "p_002", sku: "KBD-WL-104", barcode: "0850001000024", name: "Wireless Keyboard Slim", description: "Full-size low-profile wireless keyboard, USB-C rechargeable.", categoryId: "cat_keyboards", supplierId: "sup_techsource", costPrice: 21.5, sellPrice: 44.99, quantityOnHand: 18, reorderPoint: 20 },
  { id: "p_003", sku: "MSE-WL-PRO", barcode: "0850001000031", name: "Wireless Mouse Pro", description: "Ergonomic wireless mouse, 8000 DPI, USB-C + 2.4GHz dongle.", categoryId: "cat_mice", supplierId: "sup_pericore", costPrice: 16.0, sellPrice: 34.99, quantityOnHand: 9, reorderPoint: 25 },
  { id: "p_004", sku: "MSE-RGB-16K", barcode: "0850001000048", name: "Gaming Mouse RGB", description: "Lightweight gaming mouse, 16K DPI optical sensor, RGB.", categoryId: "cat_mice", supplierId: "sup_nexus", costPrice: 19.0, sellPrice: 49.99, quantityOnHand: 0, reorderPoint: 15 },
  { id: "p_005", sku: "MON-27-QHD", barcode: "0850001000055", name: '27" QHD Monitor 165Hz', description: "27-inch 2560x1440 IPS gaming monitor, 165Hz, HDMI + DP.", categoryId: "cat_monitors", supplierId: "sup_techsource", costPrice: 145.0, sellPrice: 279.99, quantityOnHand: 22, reorderPoint: 8 },
  { id: "p_006", sku: "MON-24-FHD", barcode: "0850001000062", name: '24" FHD Monitor', description: "24-inch 1920x1080 IPS monitor, 75Hz, HDMI + VGA.", categoryId: "cat_monitors", supplierId: "sup_techsource", costPrice: 78.0, sellPrice: 149.99, quantityOnHand: 6, reorderPoint: 10 },
  { id: "p_007", sku: "HST-USB-STR", barcode: "0850001000079", name: "USB Headset Stereo", description: "Over-ear USB headset with noise-cancelling boom mic.", categoryId: "cat_audio", supplierId: "sup_pericore", costPrice: 17.5, sellPrice: 39.99, quantityOnHand: 53, reorderPoint: 15 },
  { id: "p_008", sku: "HST-WL-7", barcode: "0850001000086", name: "Wireless Headset 7.1", description: "Wireless gaming headset, virtual 7.1 surround, 30h battery.", categoryId: "cat_audio", supplierId: "sup_nexus", costPrice: 42.0, sellPrice: 89.99, quantityOnHand: 31, reorderPoint: 12 },
  { id: "p_009", sku: "CAM-1080-W", barcode: "0850001000093", name: "1080p Webcam", description: "Full HD 1080p webcam with dual mics and privacy shutter.", categoryId: "cat_webcams", supplierId: "sup_pericore", costPrice: 14.0, sellPrice: 32.99, quantityOnHand: 12, reorderPoint: 20 },
  { id: "p_010", sku: "SSD-EXT-1TB", barcode: "0850001000109", name: "Portable SSD 1TB", description: "USB-C external SSD, 1TB, up to 1050 MB/s.", categoryId: "cat_storage", supplierId: "sup_nexus", costPrice: 58.0, sellPrice: 109.99, quantityOnHand: 40, reorderPoint: 10 },
  { id: "p_011", sku: "HUB-USBC-7", barcode: "0850001000116", name: "USB-C Hub 7-in-1", description: "7-in-1 USB-C hub: HDMI 4K, 3x USB-A, SD/microSD, 100W PD.", categoryId: "cat_docks", supplierId: "sup_cablehub", costPrice: 18.0, sellPrice: 42.99, quantityOnHand: 14, reorderPoint: 15 },
  { id: "p_012", sku: "CBL-HDMI-2M", barcode: "0850001000123", name: "HDMI 2.1 Cable 2m", description: "HDMI 2.1 cable, 2 metres, 8K@60Hz / 4K@120Hz, 48Gbps.", categoryId: "cat_cables", supplierId: "sup_cablehub", costPrice: 4.2, sellPrice: 12.99, quantityOnHand: 96, reorderPoint: 30 },
];

const movements = [
  { id: "m_001", productId: "p_001", type: "PURCHASE_IN" as const, quantity: 40, createdById: "u_priya", createdAt: new Date("2026-06-20T09:12:00Z") },
  { id: "m_002", productId: "p_003", type: "SALE_OUT" as const, quantity: -14, createdById: "u_sam", createdAt: new Date("2026-06-22T08:05:00Z") },
  { id: "m_003", productId: "p_011", type: "SALE_OUT" as const, quantity: -6, createdById: "u_sam", createdAt: new Date("2026-06-22T07:10:00Z") },
  { id: "m_004", productId: "p_004", type: "SALE_OUT" as const, quantity: -15, createdById: "u_priya", createdAt: new Date("2026-06-19T11:45:00Z") },
  { id: "m_005", productId: "p_011", type: "ADJUSTMENT" as const, quantity: -2, reason: "Damaged packaging", createdById: "u_priya", createdAt: new Date("2026-06-22T06:30:00Z") },
  { id: "m_006", productId: "p_009", type: "SALE_OUT" as const, quantity: -8, createdById: "u_sam", createdAt: new Date("2026-06-21T09:55:00Z") },
  { id: "m_007", productId: "p_002", type: "SALE_OUT" as const, quantity: -10, createdById: "u_sam", createdAt: new Date("2026-06-21T14:30:00Z") },
  { id: "m_008", productId: "p_007", type: "PURCHASE_IN" as const, quantity: 30, createdById: "u_priya", createdAt: new Date("2026-06-17T13:00:00Z") },
  { id: "m_009", productId: "p_005", type: "PURCHASE_IN" as const, quantity: 24, createdById: "u_priya", createdAt: new Date("2026-06-18T16:20:00Z") },
  { id: "m_010", productId: "p_006", type: "SALE_OUT" as const, quantity: -4, createdById: "u_sam", createdAt: new Date("2026-06-22T07:10:00Z") },
];

async function main() {
  // Clear in dependency order so the seed is idempotent.
  await prisma.notification.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Suppliers must exist before supplier-linked users are created.
  await prisma.category.createMany({ data: categories });
  await prisma.supplier.createMany({ data: suppliers });

  const passwordHash = hashPassword(DEMO_PASSWORD);
  for (const u of users) {
    await prisma.user.create({ data: { ...u, passwordHash } });
  }

  await prisma.product.createMany({
    data: products.map((p) => ({
      ...p,
      imageUrl:
        productImage[p.id] ??
        categoryImage[p.categoryId] ??
        "/img/categories/placeholder.svg",
    })),
  });
  await prisma.stockMovement.createMany({ data: movements });

  console.log(
    `Seeded: ${users.length} users, ${categories.length} categories, ` +
      `${suppliers.length} suppliers, ${products.length} products, ` +
      `${movements.length} movements.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
