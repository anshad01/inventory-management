import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/field";

type Category = { id: string; name: string };

export type ShopFilterValues = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
};

/**
 * Storefront search & filter bar. A plain GET form so filters live in the URL
 * (shareable, server-rendered) — no client JS required.
 */
export function ShopFilters({
  categories,
  values,
}: {
  categories: Category[];
  values: ShopFilterValues;
}) {
  return (
    <form method="get" className="mb-6 grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative sm:col-span-2 lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={values.q ?? ""} placeholder="Search products…" className="pl-9" />
      </div>

      <Select name="category" defaultValue={values.category ?? ""}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <div className="flex items-center gap-2">
        <Input name="minPrice" type="number" min="0" step="0.01" defaultValue={values.minPrice ?? ""} placeholder="Min $" />
        <Input name="maxPrice" type="number" min="0" step="0.01" defaultValue={values.maxPrice ?? ""} placeholder="Max $" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="inStock" value="1" defaultChecked={values.inStock} className="size-4" />
          In stock
        </label>
        <Button type="submit">Apply</Button>
      </div>
    </form>
  );
}
