"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/Cart/CartProvider";

const CartIndicator = () => {
  const { items } = useCart();

  return (
    <Button asChild variant="ghost" size="sm" className="relative text-muted-foreground">
      <Link href="/" title="Koszyk" aria-label={`Koszyk, pozycji: ${items.length}`}>
        <ShoppingBag />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-medium text-brand-foreground tabular-nums">
            {items.length}
          </span>
        )}
      </Link>
    </Button>
  );
};

export default CartIndicator;
