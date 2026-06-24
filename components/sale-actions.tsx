"use client";

import { useState, useTransition } from "react";
import { Loader2, Ban, CheckCheck, Package, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voidSale, advanceOrderStatus } from "@/lib/actions/sales";

const TRANSITIONS: Record<string, { label: string; next: string; variant: "default" | "outline" | "destructive" }[]> = {
  PENDING: [
    { label: "Confirm order", next: "CONFIRMED", variant: "default" },
    { label: "Cancel order", next: "CANCELLED", variant: "destructive" },
  ],
  CONFIRMED: [
    { label: "Mark shipped", next: "SHIPPED", variant: "default" },
    { label: "Cancel order", next: "CANCELLED", variant: "destructive" },
  ],
  SHIPPED: [
    { label: "Mark delivered", next: "DELIVERED", variant: "default" },
    { label: "Cancel order", next: "CANCELLED", variant: "destructive" },
  ],
  COMPLETED: [
    { label: "Void sale", next: "VOIDED", variant: "outline" },
  ],
};

export function SaleActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const actions = TRANSITIONS[status] ?? [];
  if (actions.length === 0) return null;

  const handleAction = (next: string) => {
    setError(null);
    startTransition(async () => {
      const res = next === "VOIDED"
        ? await voidSale(id)
        : await advanceOrderStatus(id, next);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {actions.map((action) => (
          <Button
            key={action.next}
            variant={action.variant}
            disabled={pending}
            onClick={() => handleAction(action.next)}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {action.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
