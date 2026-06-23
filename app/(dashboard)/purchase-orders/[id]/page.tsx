import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { PoActions } from "@/components/po-actions";
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
import { getPurchaseOrder } from "@/lib/queries";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const po = await getPurchaseOrder(id);
  if (!po) notFound();

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/purchase-orders">
          <ArrowLeft /> Back to purchase orders
        </Link>
      </Button>

      <PageHeader title={`Purchase order ${po.poNumber}`}>
        <PoActions id={po.id} status={po.status} />
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Supplier: </span>
          <span className="font-medium">{po.supplierName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Status: </span>
          <DocStatusBadge status={po.status} />
        </div>
        <div>
          <span className="text-muted-foreground">Created: </span>
          {formatDate(po.createdAt)}
        </div>
        {po.receivedAt ? (
          <div>
            <span className="text-muted-foreground">Received: </span>
            {formatDate(po.receivedAt)}
          </div>
        ) : null}
      </div>

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
                    <Link href={`/products/${i.productId}`} className="font-medium hover:underline">
                      {i.productName}
                    </Link>
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

      {po.notes ? (
        <p className="mt-4 text-sm text-muted-foreground">Notes: {po.notes}</p>
      ) : null}
    </div>
  );
}
