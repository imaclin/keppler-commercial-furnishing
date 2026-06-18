'use client';

import { useSyncExternalStore } from 'react';

export type CartItem = {
  key: string;           // productId + config, used to dedupe
  productId: string;
  slug: string;
  title: string;
  image: string | null;
  woodName: string | null;
  finishName: string | null;
  sizeLabel: string | null;
  unitPriceCents: number;
  quantity: number;
};

const KEY = 'hw_cart';
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: CartItem[] = typeof window !== 'undefined' ? read() : EMPTY;

function read(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function commit(next: CartItem[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1) {
  const items = [...cache];
  const i = items.findIndex((x) => x.key === item.key);
  if (i >= 0) items[i] = { ...items[i], quantity: items[i].quantity + qty };
  else items.push({ ...item, quantity: qty });
  commit(items);
}

export function removeFromCart(key: string) {
  commit(cache.filter((x) => x.key !== key));
}

export function setQty(key: string, qty: number) {
  commit(cache.map((x) => (x.key === key ? { ...x, quantity: Math.max(1, qty) } : x)));
}

export function clearCart() {
  commit([]);
}

function onStorage(e: StorageEvent) {
  if (e.key === KEY) { cache = read(); listeners.forEach((l) => l()); }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, () => cache, () => EMPTY);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  return { items, count, subtotalCents };
}
