import Link from "next/link";
import { Plus, Package } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StockBadge } from "@/components/stock-badge";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupplierProducts } from "@/lib/queries";
import { requireSupplier } from "@/lib/auth/session";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalProductsPage() {
  const user = await requireSupplier();
  const products = await getSupplierProducts(user.supplierId!);

  return (
    <div>
      <PageHeader title="Your products" description="Products you list for sale.">
        {user.isApproved ? (
          <Button asChild>
            <Link href="/portal/products/new">
              <Plus /> Add product
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Package className="size-6" />
              </div>
              <p className="font-medium">No products yet</p>
              {user.isApproved ? (
                <Button asChild>
                  <Link href="/portal/products/new">Add your first product</Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={p.imageUrl}
                          alt={p.name}
                          className="size-10 shrink-0 rounded-md border"
                        />
                        <div>
                          <Link
                            href={`/portal/products/${p.id}/edit`}
                            className="font-medium hover:underline"
                          >
                            {p.name}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">
                            {p.sku}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.categoryName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.sellPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatNumber(p.quantityOnHand)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StockBadge product={p} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
