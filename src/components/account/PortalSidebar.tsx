'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

const NAV = [
  { href: '/account', label: 'Dashboard' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/quotes', label: 'Quotes' },
  { href: '/account/favorites', label: 'Favorites' },
  { href: '/account/samples', label: 'Wood Samples' },
  { href: '/account/messages', label: 'Messages' },
  { href: '/account/profile', label: 'Profile' },
];

export function PortalSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--paper)] py-8">
      <Link href="/" className="serif block px-7 text-center text-3xl tracking-[0.2em] text-[var(--espresso)]">HW</Link>
      <div className="mb-8 text-center text-[8px] uppercase tracking-[0.4em] text-[var(--stone)]">My Account</div>
      <nav className="flex flex-1 flex-col">
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
  );
}
