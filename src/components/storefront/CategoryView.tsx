'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/storefront/ProductCard';
import type { StorefrontCard, WoodSpecies } from '@/lib/types';
import { getCategoryProductsAction } from '@/app/actions/storefront';

export function CategoryView({
  category, title, intro, woods, initial,
}: {
  category: 'table' | 'chair'; title: string; intro: string; woods: WoodSpecies[]; initial: StorefrontCard[];
}) {
  const [woodId, setWoodId] = useState<string>('');
  const [sort, setSort] = useState<'featured' | 'price_asc' | 'price_desc' | 'newest'>('featured');
  const [items, setItems] = useState<StorefrontCard[]>(initial);

  useEffect(() => {
    getCategoryProductsAction(category, woodId || undefined, sort).then(setItems).catch(() => {});
  }, [category, woodId, sort]);

  return (
    <div className="mx-auto max-w-[1320px] px-14">
      <div className="py-10 text-center">
        <h1 className="serif text-5xl text-[var(--ink)]">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--stone)]">{intro}</p>
      </div>
      <div className="flex items-center justify-between border-y border-[var(--line)] py-4 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-[var(--stone)]">Wood</span>
          <select value={woodId} onChange={(e) => setWoodId(e.target.value)} className="border border-[var(--line)] px-2 py-1">
            <option value="">All</option>
            {woods.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="border border-[var(--line)] px-2 py-1">
          <option value="featured">Featured</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-12 md:grid-cols-3">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
        {items.length === 0 && <p className="col-span-full text-sm text-[var(--stone)]">No pieces match.</p>}
      </div>
    </div>
  );
}
