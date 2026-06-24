import Link from "next/link";
import { Boxes, LogOut, Package, Truck, AlertCircle } from "lucide-react";

import { logout } from "@/lib/actions/auth";
import { requireSupplier } from "@/lib/auth/session";
import { getNotifications } from "@/lib/queries";
import { NotificationBell } from "@/components/notification-bell";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSupplier();
  const { items, unread } = await getNotifications(user.id);

  return (
    <div className="min-h-svh bg-muted/20">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">Supplier Portal</span>
          <nav className="ml-4 hidden items-center gap-1 text-sm sm:flex">
            <Link
              href="/portal/products"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Package className="size-4" /> Products
            </Link>
            <Link
              href="/portal"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Truck className="size-4" /> Purchase orders
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <NotificationBell items={items} unread={unread} />
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

      <main className="mx-auto max-w-5xl px-5 py-8">
        {!user.isApproved ? (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
            <p>
              Your supplier account is <strong>awaiting admin approval</strong>. You can
              browse the portal, but you won&apos;t be able to list products until an
              administrator approves your account.
            </p>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
