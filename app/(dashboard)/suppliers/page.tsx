import Link from "next/link";
import { Plus, Truck } from "lucide-react";

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
import { getSuppliers } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Vendors you purchase stock from."
      >
        <Button asChild>
          <Link href="/suppliers/new">
            <Plus /> Add supplier
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Truck className="size-6" />
              </div>
              <p className="font-medium">No suppliers yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(s.productCount)}
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
