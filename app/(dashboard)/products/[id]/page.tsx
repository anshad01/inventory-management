import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StockBadge } from "@/components/stock-badge";
import { QuickAdjust } from "@/components/quick-adjust";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProductDetail } from "@/lib/queries";
import type { MovementType } from "@/lib/types";
import { cn, formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

const movementMeta: Record<
  MovementType,
  { label: string; icon: typeof ArrowUpRight; className: string }
> = {
  PURCHASE_IN: { label: "Purchase in", icon: ArrowUpRight, className: "text-success" },
  SALE_OUT: { label: "Sale out", icon: ArrowDownRight, className: "text-destructive" },
  ADJUSTMENT: { label: "Adjustment", icon: Pencil, className: "text-muted-foreground" },
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProductDetail(id);
  if (!detail) notFound();

  const { product, movements } = detail;
  const margin = product.sellPrice - product.costPrice;
  const marginPct =
    product.sellPrice > 0 ? (margin / product.sellPrice) * 100 : 0;

  const facts = [
    { label: "SKU", value: product.sku },
    { label: "Barcode", value: product.barcode ?? "—" },
    { label: "Category", value: product.categoryName ?? "—" },
    { label: "Supplier", value: product.supplierName ?? "—" },
    { label: "Cost price", value: formatCurrency(product.costPrice) },
    { label: "Sell price", value: formatCurrency(product.sellPrice) },
    {
      label: "Margin",
      value: `${formatCurrency(margin)} (${marginPct.toFixed(0)}%)`,
    },
    { label: "Reorder point", value: `${formatNumber(product.reorderPoint)} ${product.unit}` },
  ];

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/products">
          <ArrowLeft /> Back to products
        </Link>
      </Button>

      <PageHeader title={product.name} description={product.description}>
        <Button variant="outline">
          <Pencil /> Edit
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stock + quick adjust */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Stock on hand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-semibold tabular-nums">
                <span data-testid="qoh">{formatNumber(product.quantityOnHand)}</span>
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  {product.unit}
                </span>
              </div>
              <StockBadge product={product} />
            </div>

            <div className="mt-6">
              <QuickAdjust productId={product.id} />
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Movement history */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Movement history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No stock movements recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => {
                  const meta = movementMeta[m.type];
                  const Icon = meta.icon;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <span className="flex items-center gap-2 font-medium">
                          <Icon className={cn("size-4", meta.className)} />
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.reason ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.createdBy}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold tabular-nums",
                          m.quantity >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {m.quantity >= 0 ? "+" : ""}
                        {formatNumber(m.quantity)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
