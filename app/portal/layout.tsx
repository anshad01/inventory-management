import Link from "next/link";
import { Boxes, LogOut, Package, ShoppingCart } from "lucide-react";

import { logout } from "@/lib/actions/auth";
import { requireSupplier } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSupplier();

  return (
    <div className="min-h-svh bg-muted/20">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">Supplier Portal</span>

          {/* Nav links */}
          <nav className="ml-4 flex items-center gap-1">
            <Link
              href="/portal"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ShoppingCart className="size-4" /> Orders
            </Link>
            <Link
              href="/portal/products"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Package className="size-4" /> Products
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user.name}</span>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
