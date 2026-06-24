import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/components/product-form";
import { createProduct } from "@/lib/actions/products";
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
          <ProductForm
            action={createProduct}
            categories={categories}
            suppliers={suppliers}
            mode="create"
            cancelHref="/products"
          />
        </CardContent>
      </Card>
    </div>
  );
}
