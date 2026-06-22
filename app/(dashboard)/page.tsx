import Link from "next/link";
import { Package, DollarSign, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight, Pencil } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StockBadge } from "@/components/stock-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { products, getProduct, getRecentMovements } from "@/lib/mock-data";
import { stockStatus } from "@/lib/types";
import type { MovementType } from "@/lib/types";
import { cn, formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";

const movementMeta: Record<
  MovementType,
  { label: string; icon: typeof ArrowUpRight; className: string }
> = {
  PURCHASE_IN: { label: "Purchase", icon: ArrowUpRight, className: "text-success" },
  SALE_OUT: { label: "Sale", icon: ArrowDownRight, className: "text-destructive" },
  ADJUSTMENT: { label: "Adjustment", icon: Pencil, className: "text-muted-foreground" },
};

export default function DashboardPage() {
  const active = products.filter((p) => p.isActive);
  const stockValue = active.reduce(
    (sum, p) => sum + p.quantityOnHand * p.costPrice,
    0,
  );
  const lowStock = active.filter((p) => stockStatus(p) === "low_stock");
  const outOfStock = active.filter((p) => stockStatus(p) === "out_of_stock");
  const attention = [...outOfStock, ...lowStock].slice(0, 6);
  const recent = getRecentMovements(6);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A snapshot of your stock and recent activity."
      >
        <Button asChild>
          <Link href="/products">View products</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active products"
          value={formatNumber(active.length)}
          hint="In your catalog"
          icon={Package}
        />
        <StatCard
          label="Stock value"
          value={formatCurrency(stockValue)}
          hint="At cost price"
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Low stock"
          value={formatNumber(lowStock.length)}
          hint="At or below reorder point"
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Out of stock"
          value={formatNumber(outOfStock.length)}
          hint="Needs restocking"
          icon={XCircle}
          tone="destructive"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Needs attention */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Needs attention</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/products?filter=low">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">On hand</TableHead>
                  <TableHead className="text-right">Reorder at</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attention.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/products/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(p.quantityOnHand)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatNumber(p.reorderPoint)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StockBadge product={p} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recent.map((m) => {
              const product = getProduct(m.productId);
              const meta = movementMeta[m.type];
              const Icon = meta.icon;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted",
                      meta.className,
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {product?.name ?? "Unknown product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label} · {m.createdBy} · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      m.quantity >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {m.quantity >= 0 ? "+" : ""}
                    {formatNumber(m.quantity)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
