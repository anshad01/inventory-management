"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/lib/actions/products";

/** Delete (or archive, if it has history) a product after a confirm prompt. */
export function DeleteProductButton({
  id,
  redirectTo,
}: {
  id: string;
  redirectTo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this product? Products with history are archived instead.")) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const res = await deleteProduct(id);
            if (res.ok) {
              router.push(redirectTo);
              router.refresh();
            } else {
              setError(res.error);
            }
          });
        }}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Delete
      </Button>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
