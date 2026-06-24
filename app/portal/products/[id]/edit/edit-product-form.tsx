"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import type { ActionResult } from "@/lib/types";

// This is the client form â€” the Server Component page passes data down to it.

type Category = { id: string; name: string };
type Product = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  costPrice: number;
  sellPrice: number;
  reorderPoint: number;
  quantityOnHand: number;
  imageUrl?: string | null;
};

type Props = {
  product: Product;
  categories: Category[];
  updateAction: (formData: FormData) => Promise<ActionResult>;
  adjustAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: () => Promise<void>;
};

export function EditProductForm({
  product,
  categories,
  updateAction,
  adjustAction,
  deleteAction,
}: Props) {
  const router = useRouter();
  const [updateState, updateDispatch, updatePending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const result = await updateAction(formData);
      if (result.ok) router.refresh();
      return result;
    },
    null,
  );

  const [adjustState, adjustDispatch, adjustPending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => {
      const result = await adjustAction(formData);
      if (result.ok) router.refresh();
      return result;
    },
    null,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/portal/products">
          <ArrowLeft /> Back to products
        </Link>
      </Button>

      {/* Edit details */}
      <Card>
        <CardHeader>
          <CardTitle>Edit product</CardTitle>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </CardHeader>
        <CardContent>
          <form action={updateDispatch} className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" className="sm:col-span-2">
              <Input id="name" name="name" required defaultValue={product.name} />
            </Field>

            <Field label="Description" htmlFor="description" className="sm:col-span-2">
              <Input id="description" name="description" defaultValue={product.description ?? ""} />
            </Field>

            <Field label="Category" htmlFor="categoryId" className="sm:col-span-2">
              <Select id="categoryId" name="categoryId" defaultValue={product.categoryId ?? ""}>
                <option value="">â€” None â€”</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Cost price" htmlFor="costPrice">
              <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" defaultValue={product.costPrice} />
            </Field>
            <Field label="Sell price" htmlFor="sellPrice">
              <Input id="sellPrice" name="sellPrice" type="number" step="0.01" min="0" defaultValue={product.sellPrice} />
            </Field>

            <Field label="Reorder point" htmlFor="reorderPoint" hint="Low-stock threshold">
              <Input id="reorderPoint" name="reorderPoint" type="number" min="0" defaultValue={product.reorderPoint} />
            </Field>

            <Field label="Image URL" htmlFor="imageUrl" hint="Paste a public image URL">
              <Input id="imageUrl" name="imageUrl" type="url" defaultValue={product.imageUrl ?? ""} />
            </Field>

            {updateState && !updateState.ok && (
              <p className="sm:col-span-2 text-sm text-destructive">{updateState.error}</p>
            )}
            {updateState?.ok && (
              <p className="sm:col-span-2 text-sm text-green-600">Saved!</p>
            )}

            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="submit" disabled={updatePending}>
                {updatePending ? "Savingâ€¦" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stock adjustment */}
      <Card>
        <CardHeader>
          <CardTitle>Adjust stock</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current stock: <span className="font-semibold tabular-nums">{product.quantityOnHand}</span>
          </p>
        </CardHeader>
        <CardContent>
          <form action={adjustDispatch} className="grid gap-5 sm:grid-cols-2">
            <Field label="Quantity change" htmlFor="delta" hint="Use negative to remove stock">
              <Input id="delta" name="delta" type="number" required placeholder="+10 or -5" />
            </Field>
            <Field label="Reason" htmlFor="reason">
              <Input id="reason" name="reason" placeholder="e.g. Stock count correction" />
            </Field>

            {adjustState && !adjustState.ok && (
              <p className="sm:col-span-2 text-sm text-destructive">{adjustState.error}</p>
            )}
            {adjustState?.ok && (
              <p className="sm:col-span-2 text-sm text-green-600">Stock updated!</p>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" variant="outline" disabled={adjustPending}>
                {adjustPending ? "Applyingâ€¦" : "Apply adjustment"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete product</CardTitle>
          <p className="text-sm text-muted-foreground">
            This will deactivate the product and hide it from the store.
          </p>
        </CardHeader>
        <CardContent>
          <form action={deleteAction}>
            <Button type="submit" variant="destructive" size="sm">
              <Trash2 className="size-4" /> Delete product
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
