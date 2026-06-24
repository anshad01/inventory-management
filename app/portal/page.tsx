import Link from "next/link";
import { Truck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DocStatusBadge } from "@/components/doc-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getSupplierOrders } from "@/lib/queries";
import { requireSupplier } from "@/lib/auth/session";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const user = await requireSupplier();
  const orders = await getSupplierOrders(user.supplierId!);

  return (
    <div>
      <PageHeader title="Your purchase orders" description="Orders the store has placed with you." />
      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Truck className="size-6" />
              </div>
              <p className="font-medium">No purchase orders yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link href={`/portal/orders/${po.id}`} className="font-mono font-medium hover:underline">
                        {po.poNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(po.itemCount)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(po.createdAt)}</TableCell>
                    <TableCell className="text-right"><DocStatusBadge status={po.status} /></TableCell>
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