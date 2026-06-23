import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import { LineItemsEditor } from "@/components/line-items-editor";
import { createPurchaseOrder } from "@/lib/actions/purchasing";
import { getSuppliersBasic, getPickerProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage() {
  const [suppliers, products] = await Promise.all([
    getSuppliersBasic(),
    getPickerProducts(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/purchase-orders">
          <ArrowLeft /> Back to purchase orders
        </Link>
      </Button>

      <PageHeader
        title="New purchase order"
        description="Draft an order. Receiving it later adds the stock as movements."
      />

      <Card>
        <CardContent className="p-6">
          <form action={createPurchaseOrder} className="grid gap-5">
            <Field label="Supplier" htmlFor="supplierId" className="max-w-sm">
              <Select id="supplierId" name="supplierId" defaultValue="" required>
                <option value="" disabled>
                  — Select supplier —
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium">Line items</p>
              <LineItemsEditor
                products={products}
                priceField="unitCost"
                defaultPrice="costPrice"
              />
            </div>

            <Field label="Notes" htmlFor="notes">
              <Input id="notes" name="notes" placeholder="Optional" />
            </Field>

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link href="/purchase-orders">Cancel</Link>
              </Button>
              <Button type="submit">Create draft</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
