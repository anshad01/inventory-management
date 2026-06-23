"use client";

import { useState, useTransition } from "react";
import { Loader2, CheckCircle2, Truck, PackageCheck, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { advanceOrder, cancelOrder } from "@/lib/actions/sales";
import { ORDER_TRANSITIONS, type SaleStatus } from "@/lib/orders";

const NEXT_META: Record<
  Exclude<SaleStatus, "PENDING" | "CANCELLED">,
  { label: string; icon: typeof CheckCircle2 }
> = {
  CONFIRMED: { label: "Confirm order", icon: CheckCircle2 },
  SHIPPED: { label: "Mark shipped", icon: Truck },
  DELIVERED: { label: "Mark delivered", icon: PackageCheck },
};

/** Staff order-fulfilment controls: advance through the workflow or cancel.
 * Only valid next states (per ORDER_TRANSITIONS) are offered. */
export function SaleActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const from = status as SaleStatus;
  const nextStates = (ORDER_TRANSITIONS[from] ?? []).filter(
    (s) => s !== "CANCELLED",
  );
  const canCancel = (ORDER_TRANSITIONS[from] ?? []).includes("CANCELLED");

  if (nextStates.length === 0 && !canCancel) return null;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Failed.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {nextStates.map((to) => {
          const meta = NEXT_META[to as keyof typeof NEXT_META];
          const Icon = meta.icon;
          return (
            <Button key={to} disabled={pending} onClick={() => run(() => advanceOrder(id, to))}>
              {pending ? <Loader2 className="animate-spin" /> : <Icon />} {meta.label}
            </Button>
          );
        })}
        {canCancel ? (
          <Button variant="outline" disabled={pending} onClick={() => run(() => cancelOrder(id))}>
            <Ban /> Cancel
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
