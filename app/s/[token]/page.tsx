import { notFound } from "next/navigation";
import { Boxes } from "lucide-react";

import { StockBadge } from "@/components/stock-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { getShareSnapshot } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Public, read-only snapshot. Exposes only non-sensitive fields — no cost
// prices (SPEC.md §7).
export default async function PublicSnapshotPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await getShareSnapshot(token);
  if (!snapshot) notFound();

  return (
    <div className="mx-auto min-h-svh max-w-4xl px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Boxes className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{snapshot.title}</h1>
          <p className="text-sm text-muted-foreground">
            Live inventory snapshot · {snapshot.products.length} products
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.sku}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${p.sellPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(p.quantityOnHand)} {p.unit}
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

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Powered by Inventory · read-only snapshot
      </p>
    </div>
  );
}
