"use client";

import { useState, useTransition } from "react";
import { Minus, Plus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adjustStock } from "@/lib/actions";

export function QuickAdjust({ productId }: { productId: string }) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(direction: 1 | -1) {
    setError(null);
    const delta = direction * Math.abs(qty || 0);
    startTransition(async () => {
      const res = await adjustStock(productId, delta, reason);
      if (!res.ok) setError(res.error);
      else setReason("");
    });
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Quick adjust</p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
          className="w-20"
          aria-label="Quantity"
        />
        <Button
          variant="outline"
          className="flex-1"
          disabled={pending}
          onClick={() => submit(-1)}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Minus />} Remove
        </Button>
        <Button
          className="flex-1"
          disabled={pending}
          onClick={() => submit(1)}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Plus />} Add
        </Button>
      </div>
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional, e.g. damaged, recount)"
        className="mt-2"
      />
      {error ? (
        <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Adjustments create a stock movement — quantity is never edited
          directly.
        </p>
      )}
    </div>
  );
}
