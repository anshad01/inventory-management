import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import { requireSupplier } from "@/lib/auth/session";
import { getCategories } from "@/lib/queries";
import { supplierCreateProduct } from "@/lib/actions/supplier-products";

export const dynamic = "force-dynamic";

export default async function PortalNewProductPage() {
  await requireSupplier();
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/portal/products">
          <ArrowLeft /> Back to products
        </Link>
      </Button>

      <PageHeader
        title="Add product"
        description="List a new product. Opening stock is recorded as a movement."
      />

      <Card>
        <CardContent className="p-6">
          <form action={supplierCreateProduct} className="grid gap-5 sm:grid-cols-2">
            <Field label="SKU" htmlFor="sku" className="sm:col-span-1">
              <Input id="sku" name="sku" required placeholder="PROD-001" />
            </Field>
            <Field label="Name" htmlFor="name" className="sm:col-span-1">
              <Input id="name" name="name" required placeholder="Product name" />
            </Field>

            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <Input id="description" name="description" placeholder="Short description" />
            </Field>

            <Field label="Category" htmlFor="categoryId" className="sm:col-span-2">
              <Select id="categoryId" name="categoryId" defaultValue="">
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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

            <Field label="Reorder point" htmlFor="reorderPoint" hint="Low-stock alert threshold">
              <Input id="reorderPoint" name="reorderPoint" type="number" min="0" defaultValue="0" />
            </Field>
            <Field label="Opening stock" htmlFor="openingQty" hint="Recorded as a purchase-in">
              <Input id="openingQty" name="openingQty" type="number" min="0" defaultValue="0" />
            </Field>

            <Field label="Image URL" htmlFor="imageUrl" className="sm:col-span-2" hint="Paste a public image URL">
              <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://..." />
            </Field>

            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button asChild variant="outline" type="button">
                <Link href="/portal/products">Cancel</Link>
              </Button>
              <Button type="submit">Create product</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
