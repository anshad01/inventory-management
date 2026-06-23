import { Badge } from "@/components/ui/badge";

type Variant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const MAP: Record<string, { label: string; variant: Variant }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ORDERED: { label: "Ordered", variant: "warning" },
  RECEIVED: { label: "Received", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  COMPLETED: { label: "Completed", variant: "success" },
  VOIDED: { label: "Voided", variant: "destructive" },
};

export function DocStatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, variant: "outline" as Variant };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
