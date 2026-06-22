"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "";

  function select(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("category", id);
    else params.delete("category");
    router.replace(`/products?${params.toString()}`);
  }

  const chip = (id: string, label: string) => (
    <button
      key={id || "all"}
      type="button"
      onClick={() => select(id)}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active === id
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {chip("", "All")}
      {categories.map((c) => chip(c.id, c.name))}
    </div>
  );
}
