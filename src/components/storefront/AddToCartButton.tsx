'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ShoppingBag } from 'lucide-react';
import { addToCart, type CartItem } from '@/lib/cart';
import { Button } from '@/components/ui/button';

export function AddToCartButton({ item }: { item: Omit<CartItem, 'quantity'> }) {
  const [added, setAdded] = useState(false);

  function add() {
    addToCart(item);
    setAdded(true);
  }

  if (added) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 border border-[var(--walnut)] bg-[var(--bone)] py-3 text-sm text-[var(--walnut)]">
          <Check className="h-4 w-4" /> Added to cart
        </div>
        <div className="flex gap-3">
          <Link href="/cart" className="flex-1 bg-[var(--espresso)] py-3 text-center text-[12px] uppercase tracking-[0.18em] text-[#fffdfa]">View Cart & Request Quote</Link>
          <button onClick={() => setAdded(false)} className="border border-[var(--line)] px-4 text-[12px] uppercase tracking-[0.14em] text-[var(--ink)]">Add Another</button>
        </div>
      </div>
    );
  }

  return (
    <Button className="w-full" onClick={add}>
      <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
    </Button>
  );
}
