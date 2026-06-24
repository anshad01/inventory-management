import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const MAP: Record<string, { label: string; variant: Variant }> = {
  // Purchase orders
  DRAFT: { label: "Draft", variant: "secondary" },
  ORDERED: { label: "Ordered", variant: "warning" },
  RECEIVED: { label: "Received", variant: "success" },
  // Customer orders (sales)
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "default" },
  SHIPPED: { label: "Shipped", variant: "default" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

export function DocStatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, variant: "outline" as Variant };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
