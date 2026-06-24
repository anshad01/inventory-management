import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/components/product-form";
import { createProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/queries";
import { requireSupplier } from "@/lib/auth/session";

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
        description="List a new product. It becomes available to customers immediately."
      />

      <Card>
        <CardContent className="p-6">
          {/* No supplier picker — products are listed under your own account. */}
          <ProductForm
            action={createProduct}
            categories={categories}
            mode="create"
            cancelHref="/portal/products"
          />
        </CardContent>
      </Card>
    </div>
  );
}
