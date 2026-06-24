import { Download, DollarSign, Tag, Boxes, ShoppingCart, CalendarDays } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getValuationReport, getSalesReport } from "@/lib/queries";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [{ rows, totalCost, totalRetail, totalUnits }, sales] = await Promise.all([
    getValuationReport(),
    getSalesReport(),
  ]);
  const potentialMargin = totalRetail - totalCost;
  const maxDayRevenue = Math.max(1, ...sales.perDay.map((d) => d.revenue));

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Sales performance and inventory valuation."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/export/orders.csv">
              <Download /> Orders CSV
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/export/inventory.csv">
              <Download /> Inventory CSV
            </a>
          </Button>
        </div>
      </PageHeader>

      {/* Sales & revenue aggregates */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatCurrency(sales.totalRevenue)} icon={DollarSign} tone="success" />
        <StatCard label="Orders" value={formatNumber(sales.orderCount)} icon={ShoppingCart} />
        <StatCard label="Orders today" value={formatNumber(sales.ordersToday)} icon={CalendarDays} />
        <StatCard
          label="Avg order value"
          value={formatCurrency(sales.orderCount ? sales.totalRevenue / sales.orderCount : 0)}
          icon={Tag}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders per day (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {sales.perDay.map((d) => (
              <div key={d.date} className="flex items-center gap-3 text-sm">
                <span className="w-16 shrink-0 text-muted-foreground">
                  {formatDate(d.date)}
                </span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full rounded bg-primary/70"
                    style={{ width: `${Math.round((d.revenue / maxDayRevenue) * 100)}%` }}
                  />
                </div>
                <span className="w-10 text-right tabular-nums">{formatNumber(d.orders)}</span>
                <span className="w-20 text-right tabular-nums text-muted-foreground">
                  {formatCurrency(d.revenue)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue per supplier</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {sales.bySupplier.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                No sales recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Units sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.bySupplier.map((s) => (
                    <TableRow key={s.supplier}>
                      <TableCell className="font-medium">{s.supplier}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(s.units)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(s.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Inventory valuation</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Units on hand" value={formatNumber(totalUnits)} icon={Boxes} />
        <StatCard
          label="Stock value (cost)"
          value={formatCurrency(totalCost)}
          icon={DollarSign}
          tone="success"
        />
        <StatCard
          label="Retail value"
          value={formatCurrency(totalRetail)}
          icon={Tag}
        />
        <StatCard
          label="Potential margin"
          value={formatCurrency(potentialMargin)}
          hint="Retail − cost"
          icon={DollarSign}
          tone="warning"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Valuation by product</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost value</TableHead>
                <TableHead className="text-right">Retail value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-medium">{p.name}</span>
                    <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(p.quantityOnHand)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(p.costPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(p.sellPrice)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.costValue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.retailValue)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">
                  Totals
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(totalCost)}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(totalRetail)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
