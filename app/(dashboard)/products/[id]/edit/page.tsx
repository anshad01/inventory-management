import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProductForm } from "@/components/product-form";
import { updateProduct } from "@/lib/actions/products";
import { getProductDetail, getCategories, getSuppliersBasic } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, categories, suppliers] = await Promise.all([
    getProductDetail(id),
    getCategories(),
    getSuppliersBasic(),
  ]);
  if (!detail) notFound();
  const { product } = detail;

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href={`/products/${id}`}>
          <ArrowLeft /> Back to product
        </Link>
      </Button>

      <PageHeader title={`Edit ${product.name}`} description="Update product details and image." />

      <Card>
        <CardContent className="p-6">
          <ProductForm
            action={updateProduct.bind(null, id)}
            categories={categories}
            suppliers={suppliers}
            product={{
              name: product.name,
              description: product.description,
              categoryId: product.categoryId,
              supplierId: product.supplierId,
              costPrice: product.costPrice,
              sellPrice: product.sellPrice,
              reorderPoint: product.reorderPoint,
              imageUrl: product.imageUrl,
            }}
            mode="edit"
            cancelHref={`/products/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
