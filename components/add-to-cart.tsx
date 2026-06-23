"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/components/cart-context";

export function AddToCart({
  product,
  disabled,
}: {
  product: Omit<CartItem, "qty">;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (disabled) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="w-full"
      onClick={() => {
        add(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      {added ? <Check /> : <Plus />} {added ? "Added" : "Add to cart"}
    </Button>
  );
}
