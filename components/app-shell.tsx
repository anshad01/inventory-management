"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Search, Bell } from "lucide-react";

import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh w-full">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">Inventory</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              PA
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">Priya Anand</div>
              <div className="truncate text-xs text-muted-foreground">
                Admin
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-5 backdrop-blur">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Boxes className="size-4" />
            </div>
            <span className="font-semibold">Inventory</span>
          </div>
          <div className="relative ml-auto w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products by name or SKU…"
              className="pl-9"
            />
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Bell className="size-4" />
          </button>
        </header>
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
