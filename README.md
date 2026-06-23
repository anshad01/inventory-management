# Inventory

A small-business / retail inventory system for a **computer-peripherals store** —
track products, stock levels, suppliers, and the movement of goods. Built on
**Next.js (App Router) + PostgreSQL + Prisma**. See [`SPEC.md`](./SPEC.md) for the
full specification.

## Stack

- **Next.js 16** (App Router, Server Components + Server Actions), TypeScript
- **PostgreSQL** + **Prisma** ORM
- **Tailwind v4** + shadcn-style UI primitives (`components/ui`)

## What's implemented

- **Dashboard** — KPIs (active products, stock value, low/out-of-stock),
  needs-attention list, recent activity (all from the DB).
- **Products** — list with search + category filter, detail page with movement
  history, **quick stock adjust**, and an **Add product** form.
- **Suppliers** — directory with product counts and an **Add supplier** form.
- **Stock movements** are the source of truth: every quantity change creates a
  `StockMovement` and updates `Product.quantityOnHand` in one transaction.
  Negative stock is rejected (SPEC §4).
- Planned (placeholders in the UI): Purchase Orders, Sales, Share Links, Users.

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
app/(dashboard)/     authenticated app screens (dashboard, products, suppliers, …)
components/          UI components + primitives (components/ui)
lib/db.ts            Prisma client singleton
lib/queries.ts       server-side reads (Decimals -> plain numbers)
lib/actions.ts       Server Actions: adjust stock, create product/supplier
prisma/schema.prisma data model (SPEC §3)
prisma/seed.ts       demo dataset
```
