'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const NAV = [
  { href: '/tables', label: 'Tables' },
  { href: '/chairs', label: 'Chairs' },
  { href: '/collections', label: 'Collections' },
  { href: '/our-craft', label: 'Our Craft' },
];

const UTIL = [
  { href: '/search', label: 'Search' },
  { href: '/consultation', label: 'Consultation' },
  { href: '/account', label: 'Account' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto grid max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center px-5 h-[72px] md:px-14 md:h-[86px]">
        {/* Left: desktop primary nav / mobile hamburger */}
        <nav aria-label="Primary" className="hidden gap-7 text-xs uppercase tracking-[0.13em] md:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="text-[var(--ink)]">{n.label}</Link>)}
        </nav>
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="text-[var(--ink)] md:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="text-center" onClick={() => setOpen(false)}>
          <span className="serif block text-3xl font-semibold tracking-[0.18em] text-[var(--espresso)] leading-none md:text-4xl">HW</span>
        </Link>

        {/* Right: desktop utility nav / mobile account */}
        <nav aria-label="Utility" className="hidden justify-end gap-6 text-xs uppercase tracking-[0.13em] md:flex">
          {UTIL.map((n) => <Link key={n.href} href={n.href} className="text-[var(--ink)]">{n.label}</Link>)}
        </nav>
        <Link href="/account" className="justify-self-end text-xs uppercase tracking-[0.13em] text-[var(--ink)] md:hidden">Account</Link>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-[var(--line)] md:hidden">
          <nav className="flex flex-col px-5 py-2">
            {[...NAV, ...UTIL].map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-3 text-sm uppercase tracking-[0.13em] text-[var(--ink)]">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
