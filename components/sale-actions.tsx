"use client";

import { useState, useTransition } from "react";
import { Loader2, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { voidSale } from "@/lib/actions/sales";

export function SaleActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "VOIDED") return null;

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await voidSale(id);
            if (!res.ok) setError(res.error);
          });
        }}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Ban />} Void sale
      </Button>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
