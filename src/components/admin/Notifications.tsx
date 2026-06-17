'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, FileText, MessageSquare, Clock, Package } from 'lucide-react';
import type { AttentionCounts } from '@/lib/analytics';

export function Notifications({ counts }: { counts: AttentionCounts }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const items = [
    { key: 'q', n: counts.quotesToPrice, label: 'quotes awaiting pricing', href: '/admin/quotes', Icon: FileText },
    { key: 'm', n: counts.unreadMessages, label: 'unread messages', href: '/admin/messages', Icon: MessageSquare },
    { key: 'o', n: counts.overdueOrders, label: 'overdue orders', href: '/admin/orders?status=overdue', Icon: Clock },
    { key: 's', n: counts.samplesToShip, label: 'sample requests', href: '/admin', Icon: Package },
  ].filter((i) => i.n > 0);

  const total = items.reduce((sum, i) => sum + i.n, 0);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--ink)] hover:bg-[var(--bone)]"
      >
        <Bell className="h-[18px] w-[18px]" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--walnut)] px-1 text-[10px] font-semibold text-[#fffdfa]">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)] shadow-xl">
          <div className="border-b border-[var(--line)] px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">
            Notifications
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--stone)]">You&rsquo;re all caught up.</p>
          ) : (
            items.map(({ key, n, label, href, Icon }) => (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 last:border-0 hover:bg-[var(--cream)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bone)] text-[var(--walnut)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-[var(--ink)]">
                  <span className="font-semibold">{n}</span> {label}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
