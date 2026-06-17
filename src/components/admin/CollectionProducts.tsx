'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus } from 'lucide-react';
import { setProductCollectionAction } from '@/app/actions/catalog';

export type CollectionProductRow = {
  id: string;
  name: string;
  image_url: string | null;
  member: boolean;
  otherCollection: string | null;
};

export function CollectionProducts({ collectionId, products }: { collectionId: string; products: CollectionProductRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function toggle(row: CollectionProductRow) {
    setBusyId(row.id);
    startTransition(async () => {
      await setProductCollectionAction(row.id, row.member ? null : collectionId);
      router.refresh();
      setBusyId(null);
    });
  }

  const members = products.filter((p) => p.member);
  const others = products.filter((p) => !p.member);

  function Row({ row }: { row: CollectionProductRow }) {
    const isBusy = pending && busyId === row.id;
    return (
      <li className="flex items-center gap-4 py-3">
        {row.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.image_url} alt="" className="h-12 w-12 max-w-none shrink-0 rounded object-cover border border-[var(--line)] bg-[var(--bone)]" />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded border border-[var(--line)] bg-[var(--bone)]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[var(--ink)]">{row.name}</div>
          {!row.member && row.otherCollection && (
            <div className="text-xs text-[var(--stone)]">Currently in {row.otherCollection}</div>
          )}
        </div>
        <button
          onClick={() => toggle(row)}
          disabled={isBusy}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.1em] disabled:opacity-50 ${
            row.member
              ? 'border-[var(--walnut)] bg-[var(--bone)] text-[var(--walnut)] hover:border-red-300 hover:text-red-600'
              : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--espresso)]'
          }`}
        >
          {row.member ? <><Check className="h-3.5 w-3.5" /> In collection</> : <><Plus className="h-3.5 w-3.5" /> Add</>}
        </button>
      </li>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <section>
        <div className="eyebrow mb-2">In this collection ({members.length})</div>
        <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {members.map((row) => <Row key={row.id} row={row} />)}
          {members.length === 0 && <li className="py-4 text-sm text-[var(--stone)]">No products yet. Add some from the right.</li>}
        </ul>
      </section>
      <section>
        <div className="eyebrow mb-2">Available products ({others.length})</div>
        <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {others.map((row) => <Row key={row.id} row={row} />)}
          {others.length === 0 && <li className="py-4 text-sm text-[var(--stone)]">Every product is in this collection.</li>}
        </ul>
      </section>
    </div>
  );
}
