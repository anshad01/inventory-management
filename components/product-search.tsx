"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function ProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("q", value);
    else params.delete("q");
    startTransition(() => {
      router.replace(`/products?${params.toString()}`);
    });
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search name, SKU or barcode…"
        className="pl-9"
      />
    </div>
  );
}
