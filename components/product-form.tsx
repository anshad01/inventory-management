import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";

type Option = { id: string; name: string };

export type ProductFormValues = {
  id?: string;
  sku?: string;
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  costPrice?: number;
  sellPrice?: number;
  reorderPoint?: number;
  imageUrl?: string | null;
};

/**
 * Shared create/edit form for products, used by both the staff dashboard and
 * the supplier portal. `mode` toggles the create-only fields (SKU, opening
 * stock). When `suppliers` is omitted (supplier portal) the supplier is implied
 * by the account and the picker is hidden.
 */
export function ProductForm({
  action,
  categories,
  suppliers,
  product,
  mode,
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: Option[];
  suppliers?: Option[];
  product?: ProductFormValues;
  mode: "create" | "edit";
  cancelHref: string;
}) {
  const p = product ?? {};
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      {mode === "create" ? (
        <Field label="SKU" htmlFor="sku">
          <Input id="sku" name="sku" required placeholder="KBD-MECH-87" defaultValue={p.sku} />
        </Field>
      ) : null}
      <Field label="Name" htmlFor="name" className={mode === "create" ? "" : "sm:col-span-2"}>
        <Input id="name" name="name" required placeholder="Mechanical Keyboard TKL" defaultValue={p.name} />
      </Field>

      <Field label="Description" htmlFor="description" className="sm:col-span-2">
        <Input id="description" name="description" placeholder="Short description" defaultValue={p.description ?? ""} />
      </Field>

      {p.imageUrl ? (
        <div className="sm:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt={p.name ?? "Current product image"}
            className="h-24 w-24 rounded-md border object-cover"
          />
        </div>
      ) : null}

      <Field
        label={p.imageUrl ? "Replace image" : "Product image"}
        htmlFor="image"
        className="sm:col-span-2"
        hint="PNG, JPEG, WebP or GIF, up to 1 MB. Optional."
      >
        <Input id="image" name="image" type="file" accept="image/*" />
      </Field>

      <Field label="Category" htmlFor="categoryId">
        <Select id="categoryId" name="categoryId" defaultValue={p.categoryId ?? ""} required>
          <option value="" disabled>
            — Select a category —
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      {suppliers ? (
        <Field label="Supplier" htmlFor="supplierId">
          <Select id="supplierId" name="supplierId" defaultValue={p.supplierId ?? ""}>
            <option value="">— None —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="Cost price" htmlFor="costPrice">
        <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" defaultValue={p.costPrice ?? 0} />
      </Field>
      <Field label="Sell price" htmlFor="sellPrice">
        <Input id="sellPrice" name="sellPrice" type="number" step="0.01" min="0" defaultValue={p.sellPrice ?? 0} />
      </Field>

      <Field label="Reorder point" htmlFor="reorderPoint" hint="Low-stock threshold">
        <Input id="reorderPoint" name="reorderPoint" type="number" min="0" defaultValue={p.reorderPoint ?? 0} />
      </Field>
      {mode === "create" ? (
        <Field label="Opening stock" htmlFor="openingQty" hint="Recorded as a purchase-in">
          <Input id="openingQty" name="openingQty" type="number" min="0" defaultValue={0} />
        </Field>
      ) : null}

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button asChild variant="outline" type="button">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button type="submit">{mode === "create" ? "Create product" : "Save changes"}</Button>
      </div>
    </form>
  );
}
