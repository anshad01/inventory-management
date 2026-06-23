# Deploying Inventory (Vercel + Supabase)

This guide takes the app from the repo to a public, clickable URL using
**Supabase** (managed Postgres) and **Vercel** (Next.js hosting). Both have free
tiers that are plenty for a small shop, and both sign in with GitHub.

The app reads its database connection from a single `DATABASE_URL` env var, so
moving from local Postgres to Supabase is just a matter of configuration — no
code changes to the data layer.

---

## Prerequisites

- The repo is pushed to GitHub (branch `claude/shareable-artifact-design-tjkmcu`,
  or merge it to `main` first).
- A **Supabase** account — https://supabase.com (GitHub login).
- A **Vercel** account — https://vercel.com (GitHub login).
- Node 22+ and pnpm locally (only needed to run the one-time migration).

---

## Step 1 — Create the Supabase database

1. In Supabase, click **New project**. Pick a name, a region close to your
   users, and set a strong **database password** (save it).
2. Wait for the project to finish provisioning.
3. Go to **Project Settings → Database → Connection string** and copy two URIs
   (Supabase shows both):
   - **Direct connection** (host `db.<ref>.supabase.co`, port **5432**) — used
     to run migrations.
   - **Transaction pooler** (host `...pooler.supabase.com`, port **6543**) —
     used by the app at runtime (serverless-friendly).

   Replace `[YOUR-PASSWORD]` in each URI with the password from step 1.

> **Why two?** Serverless functions (Vercel) open many short-lived connections,
> which can exhaust Postgres. The pooler (6543) handles that. Migrations, though,
> need a direct connection (5432).

---

## Step 2 — Run the migration against Supabase (one time)

From your machine, point Prisma at the **direct** connection and apply the
schema:

```bash
# Use the DIRECT connection (port 5432) for migrations
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres"

pnpm install
pnpm exec prisma migrate deploy   # applies prisma/migrations to Supabase
```

**Optional — seed demo data:**

```bash
pnpm exec prisma db seed
```

> ⚠️ **Security:** the seed creates demo accounts with the password
> `password123` (including an Admin). For anything real, either skip seeding and
> create your own admin, or change these passwords immediately after first login.
> Never expose the demo accounts on a public deployment.

---

## Step 3 — Make Prisma generate on Vercel builds

Vercel caches `node_modules`, so the Prisma Client must be regenerated on each
build. Add a `postinstall` script to `package.json` (one-time edit):

```jsonc
{
  "scripts": {
    "postinstall": "prisma generate"
    // ...existing scripts
  }
}
```

Commit and push this change before deploying. (Without it, builds may use a
stale Prisma Client.)

---

## Step 4 — Import the project into Vercel

1. In Vercel, click **Add New… → Project** and import the GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build/output defaults.
3. Before the first deploy, open **Environment Variables** and add:

   | Name | Value | Notes |
   |------|-------|-------|
   | `DATABASE_URL` | the **pooler** URI (port 6543) + `?pgbouncer=true&connection_limit=1` | runtime DB connection — **required** |
   | `AUTH_SECRET` | output of `openssl rand -base64 32` | signs the session cookie — **required** |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` | optional — share links already use the browser's origin |

   Example `DATABASE_URL`:
   ```
   postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

4. Click **Deploy**. When it finishes, open the generated URL.

---

## Step 5 — Verify

- Visit `https://<your-app>.vercel.app` → you should be redirected to `/login`.
- Sign in (your admin account, or the demo admin if you seeded).
- Create a **Share Link** and open its public `/s/<token>` URL in a private
  window — it should load with **no login** and without cost prices.

That public link is your shareable artifact. 🎉

---

## Updating the deployment

- **Code changes:** push to the branch Vercel is tracking → it redeploys
  automatically.
- **Schema changes:** create the migration locally (`pnpm exec prisma migrate
  dev`), commit it, then run `pnpm exec prisma migrate deploy` against the
  **direct** Supabase URL (as in Step 2) before/after the deploy.

---

## Optional: cleaner pooled/direct setup

To avoid juggling URLs by hand, add a `directUrl` to the datasource so Prisma
uses the pooled URL at runtime and the direct URL for migrations automatically:

```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")  // pooler (6543) — runtime
  directUrl = env("DIRECT_URL")    // direct (5432) — migrations
}
```

Then set both `DATABASE_URL` (pooler) and `DIRECT_URL` (direct) everywhere.

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `Can't reach database server` during migrate | You used the pooler URL for migrations — use the **direct** (5432) URL for `migrate deploy`. |
| `Too many connections` at runtime | Use the **pooler** URL (6543) with `?pgbouncer=true&connection_limit=1` for `DATABASE_URL` on Vercel. |
| `PrismaClientInitializationError` / outdated client on Vercel | Ensure the `postinstall: prisma generate` script (Step 3) is committed. |
| Login always fails after deploy | `AUTH_SECRET` not set, or changed between deploys (invalidates existing sessions — sign in again). |
| Share links point at `localhost` | Set `NEXT_PUBLIC_APP_URL` to the deployed origin. |
