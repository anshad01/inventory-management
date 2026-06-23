import Link from "next/link";
import { Package } from "lucide-react";

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
import { getCustomerOrders } from "@/lib/queries";
import { requireCustomer } from "@/lib/auth/session";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerOrdersPage() {
  const user = await requireCustomer();
  const orders = await getCustomerOrders(user.id);

  return (
    <div>
      <PageHeader title="My orders" description="Your order history." />

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Package className="size-6" />
              </div>
              <p className="font-medium">No orders yet</p>
              <Button asChild>
                <Link href="/shop">Start shopping</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link
                        href={`/shop/orders/${o.id}`}
                        className="font-mono font-medium hover:underline"
                      >
                        {o.saleNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(o.itemCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(o.soldAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DocStatusBadge status={o.status} />
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
