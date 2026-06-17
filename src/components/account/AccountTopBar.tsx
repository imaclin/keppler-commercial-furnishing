'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { CommandPalette } from '@/components/CommandPalette';
import type { CommandItem } from '@/lib/search';

const NAV_ITEMS: CommandItem[] = [
  { id: 'nav-account', group: 'Go to', label: 'Dashboard', href: '/account' },
  { id: 'nav-orders', group: 'Go to', label: 'Orders', href: '/account/orders' },
  { id: 'nav-quotes', group: 'Go to', label: 'Quotes', href: '/account/quotes' },
  { id: 'nav-favorites', group: 'Go to', label: 'Favorites', href: '/account/favorites' },
  { id: 'nav-samples', group: 'Go to', label: 'Wood Samples', href: '/account/samples' },
  { id: 'nav-messages', group: 'Go to', label: 'Messages', href: '/account/messages' },
  { id: 'nav-profile', group: 'Go to', label: 'Profile', href: '/account/profile' },
];

export function AccountTopBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex items-center gap-4 border-b border-[var(--line)] bg-[var(--paper)] px-10 py-3.5">
      <BackButton fallback="/account" />
      <button
        onClick={() => setOpen(true)}
        className="flex max-w-sm flex-1 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--stone)] hover:border-[var(--stone)]"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto rounded border border-[var(--line)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} navItems={NAV_ITEMS} />
    </div>
  );
}
