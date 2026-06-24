import Link from "next/link";
import { Package, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
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
import { requireSupplier } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalProductsPage() {
  const user = await requireSupplier();

  const products = await prisma.product.findMany({
    where: { supplierId: user.supplierId!, isActive: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Your products"
        description="Products you supply to the store."
      >
        <Button asChild size="sm">
          <Link href="/portal/products/new">
            <Plus className="size-4" /> Add product
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Package className="size-6" />
              </div>
              <p className="font-medium">No products yet</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/portal/products/new">Add your first product</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Sell price</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          p.quantityOnHand <= 0
                            ? "text-destructive font-medium"
                            : p.reorderPoint > 0 && p.quantityOnHand <= p.reorderPoint
                            ? "text-amber-600 font-medium"
                            : ""
                        }
                      >
                        {p.quantityOnHand}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(Number(p.sellPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/portal/products/${p.id}/edit`}>Edit</Link>
                      </Button>
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
