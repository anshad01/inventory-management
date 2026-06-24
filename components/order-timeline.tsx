import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type SaleStatus } from "@/lib/orders";

const FLOW: SaleStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

/** Horizontal progress indicator for a customer order's lifecycle. */
export function OrderTimeline({ status }: { status: string }) {
  const current = status as SaleStatus;

  if (current === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <X className="size-4" /> This order was cancelled.
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(current);

  return (
    <ol className="flex items-center">
      {FLOW.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                  done && "border-success bg-success text-success-foreground",
                  active && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
            {i < FLOW.length - 1 ? (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1",
                  i < currentIndex ? "bg-success" : "bg-border",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
