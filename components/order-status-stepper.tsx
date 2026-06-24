import { CheckCircle2, Circle, Package, ShoppingCart, Truck, XCircle } from "lucide-react";

const STEPS = [
  { status: "PENDING", label: "Order placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

const STATUS_INDEX: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
};

export function OrderStatusStepper({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "VOIDED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <XCircle className="size-5" />
        <span className="font-medium">
          Order {status === "CANCELLED" ? "cancelled" : "voided"}
        </span>
      </div>
    );
  }

  if (status === "COMPLETED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-green-50 p-4 text-sm text-green-700">
        <CheckCircle2 className="size-5" />
        <span className="font-medium">Order completed</span>
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[status] ?? 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step.status} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`h-0.5 flex-1 ${done || active ? "bg-primary" : "bg-muted"}`} />
                )}
                <div
                  className={`flex size-8 items-center justify-center rounded-full border-2 transition-colors
                    ${done ? "border-primary bg-primary text-primary-foreground" : ""}
                    ${active ? "border-primary bg-background text-primary" : ""}
                    ${!done && !active ? "border-muted bg-muted text-muted-foreground" : ""}
                  `}
                >
                  {done ? (
                    <CheckCircle2 className="size-4" />
                  ) : i === 0 ? (
                    <ShoppingCart className="size-4" />
                  ) : i === 1 ? (
                    <CheckCircle2 className="size-4" />
                  ) : i === 2 ? (
                    <Truck className="size-4" />
                  ) : (
                    <Package className="size-4" />
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${done ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
              <span className={`text-xs text-center ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
