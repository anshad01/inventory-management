"use client";

import { useState, useTransition } from "react";
import { Loader2, PackageCheck, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  markPurchaseOrderOrdered,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from "@/lib/actions/purchasing";

export function PoActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Failed.");
    });
  }

  const done = status === "RECEIVED" || status === "CANCELLED";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {status === "DRAFT" && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run(() => markPurchaseOrderOrdered(id))}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Send />} Mark ordered
          </Button>
        )}
        {!done && (
          <Button
            disabled={pending}
            onClick={() => run(() => receivePurchaseOrder(id))}
          >
            {pending ? <Loader2 className="animate-spin" /> : <PackageCheck />} Receive
          </Button>
        )}
        {!done && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => run(() => cancelPurchaseOrder(id))}
          >
            <X /> Cancel
          </Button>
        )}
      </div>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
