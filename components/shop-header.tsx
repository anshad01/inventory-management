"use client";

import Link from "next/link";
import { ShoppingCart, Package, LogOut } from "lucide-react";

import { useCart } from "@/components/cart-context";
import { logout } from "@/lib/actions/auth";
import { NotificationBell, type NotificationItem } from "@/components/notification-bell";

export function ShopHeader({
  name,
  notifications,
  unread,
}: {
  name: string;
  notifications: NotificationItem[];
  unread: number;
}) {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-5">
        <Link href="/shop" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="size-4" />
          </div>
          Inventory Shop
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            href="/shop/orders"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            My orders
          </Link>
          <Link
            href="/shop/cart"
            className="relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ShoppingCart className="size-4" />
            Cart
            {count > 0 ? (
              <span className="ml-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {count}
              </span>
            ) : null}
          </Link>
          <NotificationBell items={notifications} unread={unread} />
          <span className="mx-2 hidden text-muted-foreground sm:inline">{name}</span>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
