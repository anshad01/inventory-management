import { Download, DollarSign, Tag, Boxes } from "lucide-react";

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
import { getValuationReport } from "@/lib/queries";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { rows, totalCost, totalRetail, totalUnits } = await getValuationReport();
  const potentialMargin = totalRetail - totalCost;

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Inventory valuation across your active catalog."
      >
        <Button asChild variant="outline">
          <a href="/api/export/inventory.csv">
            <Download /> Export CSV
          </a>
        </Button>
      </PageHeader>

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
