"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Minus, Plus, Trash2, Loader2, ShoppingCart } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { useCart } from "@/components/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { checkout } from "@/lib/actions/shop";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, setQty, remove, clear, total } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function placeOrder() {
    setError(null);
    startTransition(async () => {
      const res = await checkout(items.map((i) => ({ id: i.id, qty: i.qty })));
      if (res.ok) {
        clear();
        router.push(`/shop/orders/${res.orderId}`);
      } else {
        setError(res.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div>
        <PageHeader title="Your cart" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingCart className="size-6" />
            </div>
            <p className="font-medium">Your cart is empty</p>
            <Button asChild>
              <Link href="/shop">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Your cart" description="Review your items and place your order." />

      <Card>
        <CardContent className="divide-y p-0">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{i.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{i.sku}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => setQty(i.id, i.qty - 1)} aria-label="Decrease">
                  <Minus />
                </Button>
                <span className="w-8 text-center tabular-nums">{i.qty}</span>
                <Button variant="outline" size="icon" onClick={() => setQty(i.id, i.qty + 1)} aria-label="Increase">
                  <Plus />
                </Button>
              </div>
              <div className="w-24 text-right font-medium tabular-nums">
                {formatCurrency(i.qty * i.price)}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(i.id)} aria-label="Remove">
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-4 flex flex-col items-end gap-3">
        <div className="text-lg">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
        </div>
        {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        <Button onClick={placeOrder} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null} Place order
        </Button>
      </div>
    </div>
  );
}
