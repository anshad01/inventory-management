import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { LineItemsEditor } from "@/components/line-items-editor";
import { createSale } from "@/lib/actions/sales";
import { getPickerProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewSalePage() {
  const products = await getPickerProducts();

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/sales">
          <ArrowLeft /> Back to sales
        </Link>
      </Button>

      <PageHeader
        title="New sale"
        description="Completing the sale records SALE_OUT movements and reduces stock."
      />

      <Card>
        <CardContent className="p-6">
          <form action={createSale} className="grid gap-5">
            <Field label="Customer" htmlFor="customerName" className="max-w-sm">
              <Input id="customerName" name="customerName" placeholder="Optional" />
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium">Line items</p>
              <LineItemsEditor
                products={products}
                priceField="unitPrice"
                defaultPrice="sellPrice"
              />
            </div>

            <Field label="Notes" htmlFor="notes">
              <Input id="notes" name="notes" placeholder="Optional" />
            </Field>

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline" type="button">
                <Link href="/sales">Cancel</Link>
              </Button>
              <Button type="submit">Complete sale</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
