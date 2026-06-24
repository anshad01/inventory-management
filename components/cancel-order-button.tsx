"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/lib/actions/sales";

/** Lets a customer cancel their own order while it is still pending. */
export function CancelOrderButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel this order? Your reserved stock will be released.")) return;
          setError(null);
          startTransition(async () => {
            const res = await cancelOrder(id);
            if (res.ok) router.refresh();
            else setError(res.error);
          });
        }}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Ban />} Cancel order
      </Button>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
