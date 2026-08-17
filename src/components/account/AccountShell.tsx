'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Search, LogOut } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { CommandPalette } from '@/components/CommandPalette';
import type { CommandItem } from '@/lib/search';

const NAV = [
  { href: '/account', label: 'Dashboard' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/quotes', label: 'Quotes' },
  { href: '/account/favorites', label: 'Favorites' },
  { href: '/account/samples', label: 'Wood Samples' },
  { href: '/account/messages', label: 'Messages' },
  { href: '/account/profile', label: 'Profile' },
];

const NAV_ITEMS: CommandItem[] = NAV.map((n) => ({ id: `nav-${n.href}`, group: 'Go to', label: n.label, href: n.href }));

export function AccountShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--cream)]">
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[248px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--paper)] py-8 transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-7 md:block">
          <Link href="/" className="serif block text-2xl tracking-[0.2em] pl-[0.2em] text-[var(--espresso)] whitespace-nowrap md:text-center">KEPPLER</Link>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-[var(--stone)] md:hidden"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-8 px-7 text-[8px] uppercase tracking-[0.4em] text-[var(--stone)] md:text-center">My Account</div>
        <nav className="flex flex-1 flex-col overflow-y-auto">
          {NAV.map((n) => {
            const active = n.href === '/account' ? pathname === '/account' : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={`px-7 py-3 text-sm ${active ? 'border-l-2 border-[var(--walnut)] bg-[var(--bone)] pl-[26px] font-medium text-[var(--walnut)]' : 'text-[var(--ink)]'}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-[var(--line)] pt-4">
          <div className="truncate px-7 pb-1 text-xs text-[var(--stone)]">{name}</div>
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-2 px-7 py-2 text-xs uppercase tracking-[0.12em] text-[var(--ink)] hover:text-[var(--walnut)]">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 py-3.5 sm:px-10">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="text-[var(--ink)] md:hidden"><Menu className="h-5 w-5" /></button>
          <div className="hidden md:block"><BackButton fallback="/account" /></div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--stone)] hover:border-[var(--stone)] md:max-w-sm"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span>Search...</span>
            <kbd className="ml-auto hidden rounded border border-[var(--line)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} navItems={NAV_ITEMS} />
    </div>
  );
}
