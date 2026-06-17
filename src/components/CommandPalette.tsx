'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
import type { CommandItem } from '@/lib/search';

interface Props {
  open: boolean;
  onClose: () => void;
  navItems: CommandItem[];
  entityItems?: CommandItem[];
}

const GROUP_ORDER = ['Go to', 'Products', 'Orders', 'Customers'];

export function CommandPalette({ open, onClose, navItems, entityItems = [] }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const all = useMemo(() => [...navItems, ...entityItems], [navItems, entityItems]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navItems; // empty query: just show navigation
    const tokens = q.split(/\s+/).filter(Boolean);
    return all
      .filter((it) => {
        const hay = `${it.label} ${it.sublabel ?? ''} ${it.group}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 50);
  }, [query, all, navItems]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const it of results) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return [...map.entries()].sort(
      (a, b) => (GROUP_ORDER.indexOf(a[0]) + 1 || 99) - (GROUP_ORDER.indexOf(b[0]) + 1 || 99),
    );
  }, [results]);

  // Flat order matching render order, for keyboard navigation.
  const flat = useMemo(() => groups.flatMap(([, items]) => items), [groups]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  function go(item: CommandItem) {
    onClose();
    router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((p) => Math.min(p + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[selected]) go(flat[selected]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }

  let idx = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-xl overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-[var(--stone)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search products, orders, customers, or jump to a page..."
            className="flex-1 bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--stone)]"
          />
          <kbd className="rounded border border-[var(--line)] bg-[var(--bone)] px-1.5 py-0.5 text-[10px] text-[var(--stone)]">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
          {flat.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-[var(--stone)]">
              No matches for &ldquo;{query}&rdquo;
            </p>
          )}
          {groups.map(([group, items]) => (
            <div key={group} className="mb-1">
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--stone)]">{group}</div>
              {items.map((it) => {
                idx++;
                const cur = idx;
                const isSel = cur === selected;
                return (
                  <button
                    key={it.id}
                    data-idx={cur}
                    onClick={() => go(it)}
                    onMouseMove={() => setSelected(cur)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${
                      isSel ? 'bg-[var(--bone)]' : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink)]">{it.label}</span>
                    {it.sublabel && (
                      <span className="shrink-0 text-xs capitalize text-[var(--stone)]">{it.sublabel}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-[var(--line)] px-4 py-2 text-[11px] text-[var(--stone)]">
          <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> navigate</span>
          <span className="flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> open</span>
          <span className="ml-auto flex items-center gap-1">
            <kbd className="rounded border border-[var(--line)] bg-[var(--bone)] px-1 py-0.5 text-[10px]">⌘K</kbd> to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
