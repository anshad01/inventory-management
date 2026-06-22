import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import { createProduct } from "@/lib/actions";
import { getCategories, getSuppliersBasic } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, suppliers] = await Promise.all([
    getCategories(),
    getSuppliersBasic(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/products">
          <ArrowLeft /> Back to products
        </Link>
      </Button>

      <PageHeader
        title="Add product"
        description="Create a catalog item. Opening stock is recorded as a movement."
      />

      <Card>
        <CardContent className="p-6">
          <form action={createProduct} className="grid gap-5 sm:grid-cols-2">
            <Field label="SKU" htmlFor="sku" className="sm:col-span-1">
              <Input id="sku" name="sku" required placeholder="KBD-MECH-87" />
            </Field>
            <Field label="Name" htmlFor="name" className="sm:col-span-1">
              <Input id="name" name="name" required placeholder="Mechanical Keyboard TKL" />
            </Field>

            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <Input id="description" name="description" placeholder="Short description" />
            </Field>

            <Field label="Category" htmlFor="categoryId">
              <Select id="categoryId" name="categoryId" defaultValue="">
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Supplier" htmlFor="supplierId">
              <Select id="supplierId" name="supplierId" defaultValue="">
                <option value="">— None —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Cost price" htmlFor="costPrice">
              <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" defaultValue="0" />
            </Field>
            <Field label="Sell price" htmlFor="sellPrice">
              <Input id="sellPrice" name="sellPrice" type="number" step="0.01" min="0" defaultValue="0" />
            </Field>

            <Field label="Reorder point" htmlFor="reorderPoint" hint="Low-stock threshold">
              <Input id="reorderPoint" name="reorderPoint" type="number" min="0" defaultValue="0" />
            </Field>
            <Field label="Opening stock" htmlFor="openingQty" hint="Recorded as a purchase-in">
              <Input id="openingQty" name="openingQty" type="number" min="0" defaultValue="0" />
            </Field>

            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button asChild variant="outline" type="button">
                <Link href="/products">Cancel</Link>
              </Button>
              <Button type="submit">Create product</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
