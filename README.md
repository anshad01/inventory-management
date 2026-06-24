# Inventory

A small-business / retail inventory system for a **computer-peripherals store** —
track products, stock levels, suppliers, and the movement of goods. Built on
**Next.js (App Router) + PostgreSQL + Prisma**. See [`SPEC.md`](./SPEC.md) for the
full specification.

## Stack

- **Next.js 16** (App Router, Server Components + Server Actions), TypeScript
- **PostgreSQL** + **Prisma** ORM
- **Tailwind v4** + shadcn-style UI primitives (`components/ui`)

## Roles

Three account types, each with its own area:

- **Admin / Staff** (`/`) — the operations dashboard: catalog, stock, purchase
  orders, sales, reports, and (admin only) user management.
- **Supplier** (`/portal`) — lists and manages their own products, and sees the
  purchase orders the store has placed with them. New suppliers need admin
  approval before they can list products.
- **Customer** (`/shop`) — browses the storefront, places orders, and tracks
  order status.

## What's implemented (maps to the assessment)

1. **Authentication, 3 roles** — email/password with hashed credentials and an
   HMAC-signed session cookie (`lib/auth/session.ts`).
2. **Catalog with categories** — every product must belong to a category
   (enforced in the create/edit forms and actions).
3. **Supplier product management** — suppliers create/edit/**delete** their own
   products from `/portal/products`, including **image upload**. Staff can manage
   any product. Delete soft-archives products that have history, hard-deletes
   otherwise.
4. **Order flow** — customers browse `/shop`, add to cart, and checkout. Stock is
   drawn down with an **atomic conditional update** (`lib/services/stock.ts`), so
   concurrent orders can never oversell or go negative.
5. **Order status workflow** — `PENDING → CONFIRMED → SHIPPED → DELIVERED`, or
   `CANCELLED`. Invalid transitions are rejected (`lib/orders.ts`); cancelling a
   not-yet-shipped order restores the stock.
6. **Admin dashboard** — KPIs plus a Reports page with revenue totals, **orders
   per day** (last 7 days) and **revenue per supplier**.
7. **Image upload** — product images are uploaded on the supplier/staff forms and
   stored as data URLs (self-contained, no object storage needed). Seed data ships
   relevant per-category placeholder images.

**Bonus implemented:** storefront search/price/stock filters · pagination
(products & shop) · in-app notifications (order updates, low stock, supplier
approval) · supplier approval workflow · CSV export of orders and inventory ·
basic in-memory rate limiting on auth/checkout.

> **Live deployment:** https://inventory-management-zeta-plum.vercel.app
> Supabase + Vercel guide, but no public URL is provisioned from this repo.

## Demo accounts

All seeded accounts share the password **`password123`**:

| Email                              | Role                          |
| ---------------------------------- | ----------------------------- |
| `priya@inventory.example`          | Admin (staff)                 |
| `sam@inventory.example`            | Staff                         |
| `viewer@inventory.example`         | Viewer (read-only staff)      |
| `supplier@techsource.example`      | Supplier (approved)           |
| `newsupplier@pericore.example`     | Supplier (pending approval)   |
| `customer@example.com`             | Customer                      |

## Local development

Requires Node 22+, pnpm, and a PostgreSQL server.

```bash
# 1. Install dependencies
pnpm install

# 2. Configure the database connection
cp .env.example .env
#   then set DATABASE_URL (a local Postgres, e.g.):
#   postgresql://inventory:inventory@127.0.0.1:5432/inventory?schema=public

# 3. Apply migrations and seed demo data (computer peripherals)
pnpm db:migrate      # prisma migrate dev
pnpm db:seed         # loads categories, suppliers, products, movements

# 4. Run
pnpm dev             # http://localhost:3000
```

Useful scripts: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm db:studio`.

## Deployment

The same schema runs on a managed Postgres (e.g. **Supabase**) — only
`DATABASE_URL` changes. Deploy the app to **Vercel**, point `DATABASE_URL` at the
managed database, run the migration against it, and (optionally) seed.

**→ See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the full step-by-step guide**
(Supabase + Vercel, env vars, migrations, and verification). Summary:

1. Create a Supabase project; copy its **direct** (5432) and **pooler** (6543)
   connection strings.
2. Run `prisma migrate deploy` against the direct URL (optionally `prisma db
   seed`).
3. Import the repo into Vercel and set `DATABASE_URL` (pooler URL), `AUTH_SECRET`,
   and `NEXT_PUBLIC_APP_URL`.
4. Deploy, then sign in and create a public `/s/:token` share link.

See also SPEC §2 and §9 (M5).

## Project structure

```
app/(dashboard)/     staff/admin screens (dashboard, products, sales, reports, users, …)
app/portal/          supplier portal (their products + purchase orders)
app/shop/            customer storefront (browse, cart, orders)
components/          UI components + primitives (components/ui)
lib/db.ts            Prisma client singleton
lib/queries.ts       server-side reads (Decimals -> plain numbers)
lib/orders.ts        customer order state machine (transition rules)
lib/services/        stock movements, notifications, image handling
lib/actions/         Server Actions (products, sales, shop, admin, auth, …)
prisma/schema.prisma data model
prisma/seed.ts       demo dataset (incl. per-category placeholder images)
```

## Assumptions & shortcuts

- **"Supplier" has two meanings here.** The store buys stock from *vendor*
  suppliers via purchase orders, **and** suppliers are sellers who list products
  for customers — both map onto the one `Supplier` record.
- **Images as data URLs.** Uploads are stored inline (capped at 1 MB) rather than
  in object storage, so the app stays self-contained and deploys with no bucket
  config. For larger media you'd swap in S3/Supabase Storage.
- **Delete = archive when there's history.** To preserve the movement/sales
  ledger, products with references are deactivated; only untouched products are
  hard-deleted.
- **Rate limiting is in-memory.** Fine for a single instance; a multi-instance
  deployment would use Redis/Upstash.
- **Stock is reserved at checkout.** Placing an order decrements stock
  immediately; cancelling before shipment restores it.

