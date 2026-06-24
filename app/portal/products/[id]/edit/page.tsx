import { notFound } from "next/navigation";

import { requireSupplier } from "@/lib/auth/session";
import { getCategories } from "@/lib/queries";
import { prisma } from "@/lib/db";
import {
  supplierUpdateProduct,
  supplierDeleteProduct,
  supplierAdjustStock,
} from "@/lib/actions/supplier-products";
import { EditProductForm } from "./edit-product-form";
import type { ActionResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PortalEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSupplier();
  const categories = await getCategories();

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.supplierId !== user.supplierId || !product.isActive) {
    notFound();
  }

  const updateAction = async (formData: FormData): Promise<ActionResult> => {
    "use server";
    return supplierUpdateProduct(id, formData);
  };

  const adjustAction = async (formData: FormData): Promise<ActionResult> => {
    "use server";
    return supplierAdjustStock(id, formData);
  };

  const deleteAction = async (): Promise<void> => {
    "use server";
    await supplierDeleteProduct(id);
  };

  return (
    <EditProductForm
      product={{
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        costPrice: Number(product.costPrice),
        sellPrice: Number(product.sellPrice),
        reorderPoint: product.reorderPoint,
        quantityOnHand: product.quantityOnHand,
        imageUrl: product.imageUrl,
      }}
      categories={categories}
      updateAction={updateAction}
      adjustAction={adjustAction}
      deleteAction={deleteAction}
    />
  );
}
