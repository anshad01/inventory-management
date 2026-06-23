import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
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
import { getSupplierOrder } from "@/lib/queries";
import { requireSupplier } from "@/lib/auth/session";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSupplier();
  const po = await getSupplierOrder(id, user.supplierId!);
  if (!po) notFound();

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/portal">
          <ArrowLeft /> Back to orders
        </Link>
      </Button>

      <PageHeader title={`Purchase order ${po.poNumber}`}>
        <DocStatusBadge status={po.status} />
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <span className="font-medium">{i.productName}</span>
                    <div className="font-mono text-xs text-muted-foreground">{i.sku}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(i.quantity)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(i.unitCost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(i.lineTotal)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(po.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {po.receivedAt ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Received by the store on {formatDate(po.receivedAt)}.
        </p>
      ) : null}
    </div>
  );
}
