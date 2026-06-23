import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/components/product-form";
import { DeleteProductButton } from "@/components/delete-product-button";
import { updateProduct } from "@/lib/actions/products";
import { getSupplierProduct, getCategories } from "@/lib/queries";
import { requireSupplier } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PortalEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSupplier();
  const [product, categories] = await Promise.all([
    getSupplierProduct(id, user.supplierId!),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/portal/products">
          <ArrowLeft /> Back to products
        </Link>
      </Button>

      <PageHeader title={`Edit ${product.name}`} description="Update details, price, stock threshold, and image.">
        <DeleteProductButton id={product.id} redirectTo="/portal/products" />
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <ProductForm
            action={updateProduct.bind(null, id)}
            categories={categories}
            product={{
              name: product.name,
              description: product.description,
              categoryId: product.categoryId,
              costPrice: product.costPrice,
              sellPrice: product.sellPrice,
              reorderPoint: product.reorderPoint,
              imageUrl: product.imageUrl,
            }}
            mode="edit"
            cancelHref="/portal/products"
          />
        </CardContent>
      </Card>
    </div>
  );
}
