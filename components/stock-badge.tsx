import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { stockStatus } from "@/lib/types";

const LABELS = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
} as const;

const VARIANTS = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "destructive",
} as const;

export function StockBadge({ product }: { product: Product }) {
  const status = stockStatus(product);
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
