import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
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
import { getSales } from "@/lib/queries";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const sales = await getSales();

  return (
    <div>
      <PageHeader title="Sales" description="Record sales that draw down stock.">
        <Button asChild>
          <Link href="/sales/new">
            <Plus /> New sale
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ShoppingCart className="size-6" />
              </div>
              <div>
                <p className="font-medium">No sales yet</p>
                <p className="text-sm text-muted-foreground">
                  Record your first sale to draw down stock.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/sales/${s.id}`}
                        className="font-mono font-medium hover:underline"
                      >
                        {s.saleNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{s.customerName ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(s.itemCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(s.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(s.soldAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DocStatusBadge status={s.status} />
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
