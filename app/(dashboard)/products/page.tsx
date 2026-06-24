import Link from "next/link";
import { Plus, Package } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StockBadge } from "@/components/stock-badge";
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
import { ProductSearch } from "@/components/product-search";
import { CategoryFilter } from "@/components/category-filter";
import { ProductImage } from "@/components/product-image";
import { Pagination } from "@/components/pagination";
import { getProducts, getCategories } from "@/lib/queries";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; filter?: string; page?: string }>;
}) {
  const { q = "", category = "", filter = "", page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const [{ rows, total, pageCount }, categories] = await Promise.all([
    getProducts({ q, category, filter, page }),
    getCategories(),
  ]);

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (filter) params.set("filter", filter);
    params.set("page", String(p));
    return `/products?${params.toString()}`;
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Your full catalog with live stock levels."
      >
        <Button asChild>
          <Link href="/products/new">
            <Plus /> Add product
          </Link>
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ProductSearch />
        <CategoryFilter categories={categories} />
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Package className="size-6" />
              </div>
              <div>
                <p className="font-medium">No products found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
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
                            href={`/products/${p.id}`}
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
                    <TableCell className="text-muted-foreground">
                      {p.supplierName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(p.costPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.sellPrice)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatNumber(p.quantityOnHand)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {p.unit}
                      </span>
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

      <Pagination page={page} pageCount={pageCount} makeHref={makeHref} />

      <p className="mt-3 text-xs text-muted-foreground">
        Showing {formatNumber(rows.length)} of {formatNumber(total)} products
      </p>
    </div>
  );
}
