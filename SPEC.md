# Inventory — Full Specification

**Project:** Inventory
**Type:** Small business / retail inventory management system
**Status:** Draft v1.0
**Date:** 2026-06-22
**Branch:** `claude/shareable-artifact-design-tjkmcu`

---

## 1. Overview

### 1.1 Purpose
Inventory is a web application that lets a small business or retail shop track
products, stock levels, suppliers, and the movement of goods (purchases and
sales). It answers the everyday questions an owner has: *What do I have? What's
running low? What did I buy and sell, and when?*

### 1.2 Goals
- Maintain an accurate, real-time count of stock on hand per product.
- Record every stock movement (purchase in, sale out, manual adjustment) so the
  current quantity is always explainable by an audit trail.
- Warn the user before they run out (low-stock alerts).
- Manage the supporting catalog: products, categories, and suppliers.
- Provide simple reporting and a shareable, read-only snapshot of inventory.

### 1.3 Non-Goals (v1)
- Point-of-sale / payment processing.
- Multi-warehouse or bin-level location tracking (single location only).
- Full accounting (COGS, tax, P&L). We track cost/price but do not do ledgers.
- Barcode hardware integration (we store SKU/barcode values but don't scan).
- Multi-tenant SaaS. v1 is single-organization.

### 1.4 Target Users / Personas
- **Owner/Admin** — full control: manage catalog, users, settings, view reports.
- **Staff** — day-to-day: record purchases/sales/adjustments, view stock.
- **Viewer** — read-only access, e.g. an accountant or a shared snapshot link.

---

## 2. Technology Stack

| Layer        | Choice                                   | Why |
|--------------|------------------------------------------|-----|
| Framework    | **Next.js 14+ (App Router)**             | One codebase for UI + API (route handlers / server actions). Required per project direction. |
| Language     | **TypeScript**                           | Type safety across UI, API, and DB models. |
| Database     | **PostgreSQL 15+**                        | Relational integrity for stock/movements; required per project direction. |
| ORM          | **Prisma**                               | Type-safe queries, migrations, great Next.js fit. |
| UI           | **React + Tailwind CSS + shadcn/ui**     | Fast, accessible, consistent components. |
| Auth         | **Auth.js (NextAuth) — credentials**     | Email/password with role-based access; minimal external deps. |
| Validation   | **Zod**                                  | Shared schema validation for forms and API. |
| Data fetching| **TanStack Query** (client) + Server Components | Caching + optimistic updates where needed. |
| Testing      | **Vitest** (unit) + **Playwright** (e2e) | Cover logic and critical user flows. |
| Tooling      | **ESLint, Prettier**                     | Consistency. |
| Deploy       | **Vercel** + **Neon/Supabase Postgres**  | Zero-config Next.js hosting; managed Postgres → shareable URL. |

**Rationale on stack choice:** the project direction fixes Next.js + Postgres.
Prisma is the natural ORM for that pairing and gives us migrations + typed
models for free. Auth.js credentials keeps auth self-contained (no third-party
identity provider needed for a small business). shadcn/ui gives us
copy-in components so we own the code and avoid a heavy dependency.

---

## 3. Data Model

### 3.1 Entity Relationship (summary)

```
User ──┐
       │ (createdBy)
Supplier ──< Product >── Category
                │
                ├──< StockMovement >── (PurchaseOrder | Sale | Adjustment)
                │
PurchaseOrder ──< PurchaseOrderItem >── Product
Sale          ──< SaleItem >── Product
ShareLink ── (snapshot config)
```

### 3.2 Tables / Models

#### User
| Field        | Type        | Notes |
|--------------|-------------|-------|
| id           | uuid (pk)   | |
| email        | string      | unique |
| passwordHash | string      | bcrypt/argon2 |
| name         | string      | |
| role         | enum        | `ADMIN` \| `STAFF` \| `VIEWER` |
| isActive     | boolean     | default true |
| createdAt    | timestamp   | |
| updatedAt    | timestamp   | |

#### Category
| Field     | Type      | Notes |
|-----------|-----------|-------|
| id        | uuid (pk) | |
| name      | string    | unique |
| description | string? | |
| createdAt | timestamp | |

#### Supplier
| Field     | Type      | Notes |
|-----------|-----------|-------|
| id        | uuid (pk) | |
| name      | string    | |
| email     | string?   | |
| phone     | string?   | |
| address   | string?   | |
| notes     | string?   | |
| createdAt | timestamp | |

#### Product
| Field          | Type         | Notes |
|----------------|--------------|-------|
| id             | uuid (pk)    | |
| sku            | string       | unique, human-readable code |
| barcode        | string?      | optional EAN/UPC |
| name           | string       | |
| description    | string?      | |
| categoryId     | uuid (fk)?   | → Category |
| supplierId     | uuid (fk)?   | → Supplier (default/preferred) |
| costPrice      | decimal(12,2)| what we pay |
| sellPrice      | decimal(12,2)| what we charge |
| quantityOnHand | int          | **derived/cached** from movements; default 0 |
| reorderPoint   | int          | low-stock threshold; default 0 |
| reorderQty     | int?         | suggested order amount |
| unit           | string       | e.g. "pcs", "kg"; default "pcs" |
| isActive       | boolean      | default true |
| imageUrl       | string?      | |
| createdAt      | timestamp    | |
| updatedAt      | timestamp    | |

> `quantityOnHand` is a cached value kept in sync transactionally whenever a
> `StockMovement` is created. The source of truth is the sum of movements; the
> cache exists for fast listing and is reconcilable.

#### StockMovement  (the audit trail / source of truth)
| Field        | Type        | Notes |
|--------------|-------------|-------|
| id           | uuid (pk)   | |
| productId    | uuid (fk)   | → Product |
| type         | enum        | `PURCHASE_IN` \| `SALE_OUT` \| `ADJUSTMENT` |
| quantity     | int         | signed: + adds stock, − removes |
| reason       | string?     | for adjustments (damage, count fix, etc.) |
| referenceType| enum?       | `PURCHASE_ORDER` \| `SALE` \| `MANUAL` |
| referenceId  | uuid?       | links to PO or Sale |
| unitCost     | decimal?    | snapshot of cost at movement time |
| createdById  | uuid (fk)   | → User |
| createdAt    | timestamp   | |

#### PurchaseOrder
| Field       | Type      | Notes |
|-------------|-----------|-------|
| id          | uuid (pk) | |
| poNumber    | string    | unique, generated |
| supplierId  | uuid (fk) | → Supplier |
| status      | enum      | `DRAFT` \| `ORDERED` \| `RECEIVED` \| `CANCELLED` |
| orderedAt   | timestamp?| |
| receivedAt  | timestamp?| |
| notes       | string?   | |
| createdById | uuid (fk) | → User |
| createdAt   | timestamp | |

#### PurchaseOrderItem
| Field      | Type        | Notes |
|------------|-------------|-------|
| id         | uuid (pk)   | |
| poId       | uuid (fk)   | → PurchaseOrder |
| productId  | uuid (fk)   | → Product |
| quantity   | int         | ordered |
| unitCost   | decimal(12,2)| |

> Receiving a PO (status → `RECEIVED`) creates `PURCHASE_IN` StockMovements for
> each item in a single transaction.

#### Sale
| Field       | Type      | Notes |
|-------------|-----------|-------|
| id          | uuid (pk) | |
| saleNumber  | string    | unique, generated |
| customerName| string?   | optional |
| status      | enum      | `COMPLETED` \| `VOIDED` |
| soldAt      | timestamp | |
| notes       | string?   | |
| createdById | uuid (fk) | → User |
| createdAt   | timestamp | |

#### SaleItem
| Field      | Type        | Notes |
|------------|-------------|-------|
| id         | uuid (pk)   | |
| saleId     | uuid (fk)   | → Sale |
| productId  | uuid (fk)   | → Product |
| quantity   | int         | sold |
| unitPrice  | decimal(12,2)| snapshot of sell price |

> Completing a Sale creates `SALE_OUT` StockMovements. Voiding reverses them.

#### ShareLink  (shareable read-only snapshot)
| Field       | Type      | Notes |
|-------------|-----------|-------|
| id          | uuid (pk) | |
| token       | string    | unique, random, used in public URL |
| title       | string    | label for the snapshot |
| scope       | enum      | `FULL_INVENTORY` \| `LOW_STOCK` \| `CATEGORY` |
| categoryId  | uuid?     | when scope = CATEGORY |
| expiresAt   | timestamp?| optional expiry |
| isActive    | boolean   | revocable |
| createdById | uuid (fk) | → User |
| createdAt   | timestamp | |

---

## 4. Business Rules

1. **Stock is never edited directly.** All quantity changes happen by creating a
   `StockMovement`. `Product.quantityOnHand` is updated in the same DB
   transaction.
2. **No negative stock by default.** A `SALE_OUT`/negative `ADJUSTMENT` that would
   drive `quantityOnHand` below 0 is rejected unless the org setting
   `allowNegativeStock` is enabled.
3. **Low stock** = `quantityOnHand <= reorderPoint` (and `reorderPoint > 0`).
4. **PO receiving is idempotent** — a PO can only move to `RECEIVED` once;
   movements are created exactly once.
5. **Voiding a sale** reverses its movements (creates compensating
   `ADJUSTMENT`/return movements), it does not delete history.
6. **SKU and barcode are unique** across active products.
7. **Price snapshots:** SaleItem.unitPrice and PurchaseOrderItem.unitCost capture
   the value at transaction time; later edits to Product prices don't rewrite
   history.
8. **Soft delete** for Products (`isActive=false`) — never hard-delete records
   referenced by movements.

---

## 5. API Specification

REST via Next.js Route Handlers under `/api`. All responses JSON. Auth via
session cookie (Auth.js). Mutations validated with Zod. Standard error shape:
`{ error: { code, message, details? } }`.

### 5.1 Auth
| Method | Path                  | Role  | Description |
|--------|-----------------------|-------|-------------|
| POST   | `/api/auth/[...nextauth]` | —  | Auth.js handler (login/logout/session) |
| POST   | `/api/users`          | ADMIN | Create user |
| GET    | `/api/users`          | ADMIN | List users |
| PATCH  | `/api/users/:id`      | ADMIN | Update role / deactivate |

### 5.2 Catalog
| Method | Path                    | Role        | Description |
|--------|-------------------------|-------------|-------------|
| GET    | `/api/products`         | any         | List/search/filter/paginate products |
| POST   | `/api/products`         | ADMIN/STAFF | Create product |
| GET    | `/api/products/:id`     | any         | Product detail + recent movements |
| PATCH  | `/api/products/:id`     | ADMIN/STAFF | Update product fields (not quantity) |
| DELETE | `/api/products/:id`     | ADMIN       | Soft-delete (isActive=false) |
| GET    | `/api/categories`       | any         | List |
| POST   | `/api/categories`       | ADMIN/STAFF | Create |
| PATCH  | `/api/categories/:id`   | ADMIN/STAFF | Update |
| GET    | `/api/suppliers`        | any         | List |
| POST   | `/api/suppliers`        | ADMIN/STAFF | Create |
| PATCH  | `/api/suppliers/:id`    | ADMIN/STAFF | Update |

### 5.3 Stock & Movements
| Method | Path                       | Role        | Description |
|--------|----------------------------|-------------|-------------|
| GET    | `/api/movements`           | any         | List/filter by product, type, date |
| POST   | `/api/movements/adjust`    | ADMIN/STAFF | Manual adjustment (+/− with reason) |
| GET    | `/api/stock/low`           | any         | Products at/below reorder point |

### 5.4 Purchasing
| Method | Path                          | Role        | Description |
|--------|-------------------------------|-------------|-------------|
| GET    | `/api/purchase-orders`        | any         | List/filter by status, supplier |
| POST   | `/api/purchase-orders`        | ADMIN/STAFF | Create draft PO with items |
| GET    | `/api/purchase-orders/:id`    | any         | Detail |
| PATCH  | `/api/purchase-orders/:id`    | ADMIN/STAFF | Update items / status (→ ORDERED) |
| POST   | `/api/purchase-orders/:id/receive` | ADMIN/STAFF | Receive → creates PURCHASE_IN movements |

### 5.5 Sales
| Method | Path                  | Role        | Description |
|--------|-----------------------|-------------|-------------|
| GET    | `/api/sales`          | any         | List/filter |
| POST   | `/api/sales`          | ADMIN/STAFF | Create sale → SALE_OUT movements |
| GET    | `/api/sales/:id`      | any         | Detail |
| POST   | `/api/sales/:id/void` | ADMIN       | Void → reversing movements |

### 5.6 Reports & Sharing
| Method | Path                       | Role        | Description |
|--------|----------------------------|-------------|-------------|
| GET    | `/api/reports/valuation`   | any         | Total stock value (Σ qty×cost) |
| GET    | `/api/reports/movements`   | any         | Movement summary over a date range |
| GET    | `/api/export/inventory.csv`| any         | CSV export of current stock |
| POST   | `/api/share-links`         | ADMIN/STAFF | Create read-only snapshot link |
| GET    | `/api/share-links`         | ADMIN/STAFF | List active links |
| DELETE | `/api/share-links/:id`     | ADMIN/STAFF | Revoke |
| GET    | `/api/public/:token`       | public      | Resolve a share link → snapshot data |

**Query params (list endpoints):** `?q=&page=&pageSize=&sort=&order=` plus
endpoint-specific filters (`categoryId`, `supplierId`, `status`, `type`,
`from`, `to`).

---

## 6. UI Specification

### 6.1 Information Architecture / Screens

| Route                     | Screen                | Notes |
|---------------------------|-----------------------|-------|
| `/login`                  | Login                 | Email + password |
| `/`                       | **Dashboard**         | KPIs: total products, stock value, low-stock count, recent movements |
| `/products`               | Product list          | Search, filter by category/supplier, low-stock badge, paginate |
| `/products/new`           | Create product        | Form |
| `/products/:id`           | Product detail        | Info, current stock, movement history, quick adjust |
| `/categories`             | Categories            | Inline CRUD |
| `/suppliers`              | Suppliers             | List + detail |
| `/purchase-orders`        | PO list               | Status filter |
| `/purchase-orders/new`    | Create PO             | Pick supplier + line items |
| `/purchase-orders/:id`    | PO detail             | Receive action |
| `/sales`                  | Sales list            | |
| `/sales/new`              | New sale              | Add line items, complete |
| `/sales/:id`              | Sale detail           | Void action |
| `/reports`                | Reports               | Valuation, movement summary, CSV export |
| `/share`                  | Share links manager   | Create/revoke read-only links |
| `/settings/users`         | User management        | ADMIN only |
| `/settings`               | Org settings          | e.g. allowNegativeStock, currency |
| `/s/:token`               | **Public snapshot**   | No auth; read-only stock view |

### 6.2 Key UX Details
- **Global search** in the top bar (products by name/SKU/barcode).
- **Low-stock indicators** — red/amber badges on lists and a dashboard widget.
- **Quick adjust** from product detail: +/− with a reason, no full form.
- **Optimistic updates** for movement creation, with rollback on error.
- **Empty states** with a clear primary action (e.g. "Add your first product").
- **Role-aware UI** — Viewers see no edit controls; Staff can't manage users.
- **Responsive** — usable on a phone/tablet at the counter.

### 6.3 Component Inventory (high level)
`AppShell` (sidebar + topbar), `DataTable` (sortable/paginated), `ProductForm`,
`MovementDialog`, `POForm`, `SaleForm`, `StatCard`, `LowStockBadge`,
`ShareLinkDialog`, `PublicSnapshotView`, `ConfirmDialog`, `EmptyState`.

---

## 7. Non-Functional Requirements

- **Security:** hashed passwords (argon2/bcrypt), role-based authorization
  enforced server-side on every mutation, CSRF protection (Auth.js), input
  validation with Zod, parameterized queries via Prisma. Public share endpoints
  expose only read-only, non-sensitive fields (no cost price unless opted in).
- **Data integrity:** all multi-row stock operations run in DB transactions;
  unique constraints on SKU/barcode/email/PO/sale numbers.
- **Performance:** product/movement lists paginated (default 25); indexes on
  `Product.sku`, `Product.categoryId`, `StockMovement.productId`,
  `StockMovement.createdAt`.
- **Auditability:** every stock change attributable to a user and timestamp.
- **Accessibility:** WCAG 2.1 AA — keyboard nav, labels, contrast (shadcn/ui base).
- **Observability:** structured server logs; basic error tracking (e.g. Sentry).
- **Backups:** rely on managed Postgres automated backups.

---

## 8. Project Structure (proposed)

```
/app
  /(auth)/login
  /(dashboard)/            # authenticated app group
    page.tsx               # dashboard
    /products
    /purchase-orders
    /sales
    /reports
    /share
    /settings
  /s/[token]/page.tsx      # public snapshot
  /api/...                 # route handlers
/components                # UI components
/lib
  /db.ts                   # Prisma client
  /auth.ts                 # Auth.js config
  /validations/*.ts        # Zod schemas
  /services/*.ts           # business logic (stock, po, sales)
/prisma
  schema.prisma
  /migrations
  seed.ts
/tests
  /unit
  /e2e
```

**Service layer note:** stock-affecting logic (receive PO, complete/void sale,
adjust) lives in `/lib/services` so it's testable and reused by API routes —
routes stay thin (validate → call service → respond).

---

## 9. Milestones / Delivery Plan

### M0 — Foundation (scaffold)
- Next.js + TypeScript + Tailwind + shadcn/ui set up.
- Prisma + Postgres connected; initial schema + migration; seed script.
- Auth.js credentials login; protected routes; role middleware.
- App shell (sidebar/topbar), CI (lint + typecheck + test).

### M1 — Catalog
- Products CRUD (with soft delete), Categories, Suppliers.
- Product list with search/filter/pagination; product detail.

### M2 — Stock movements (core value)
- StockMovement model + service; manual adjustments with reasons.
- `quantityOnHand` cache kept in sync transactionally; negative-stock guard.
- Movement history on product detail; low-stock list + dashboard widget.

### M3 — Purchasing & Sales
- Purchase Orders: create draft → order → receive (creates movements).
- Sales: create/complete (creates movements), void (reverses).

### M4 — Reports & Sharing
- Valuation + movement summary reports; CSV export.
- ShareLink CRUD; public read-only snapshot page (`/s/:token`).

### M5 — Hardening & Deploy
- Tests (unit for services, Playwright for key flows), accessibility pass.
- Deploy to Vercel + managed Postgres → **shareable URL** (the demo artifact).
- Seed demo data; write README + run instructions.

---

## 10. Open Questions / Future
- Multi-location/warehouse support (deferred).
- Barcode scanning hardware integration.
- True COGS / accounting export.
- Multi-currency beyond a single org currency.
- Email notifications for low stock / PO receipt.
- Multi-tenant (multiple organizations) if this becomes a SaaS.

---

## 11. Definition of Done (per feature)
- Server-side validation + authorization in place.
- Happy-path + key error cases handled with clear messages.
- Unit tests for service logic; e2e for the primary user flow.
- Accessible and responsive UI.
- No direct mutation of `quantityOnHand` outside the movement service.
