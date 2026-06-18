'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Search, CalendarDays, User } from 'lucide-react';

const NAV = [
  { href: '/tables', label: 'Tables' },
  { href: '/chairs', label: 'Chairs' },
  { href: '/collections', label: 'Collections' },
  { href: '/our-craft', label: 'Our Craft' },
];

const UTIL = [
  { href: '/search', label: 'Search', icon: Search },
  { href: '/consultation', label: 'Consultation', icon: CalendarDays },
  { href: '/account', label: 'Account', icon: User },
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

        {/* Right: utility icons (Search, Consultation, Account) */}
        <nav aria-label="Utility" className="flex justify-end items-center gap-5 md:gap-6">
          {UTIL.map((n) => {
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} aria-label={n.label} title={n.label} className="text-[var(--ink)] hover:text-[var(--walnut)]">
                <Icon className="h-[19px] w-[19px]" strokeWidth={1.6} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="border-t border-[var(--line)] md:hidden">
          <nav className="flex flex-col px-5 py-2">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="py-3 text-sm uppercase tracking-[0.13em] text-[var(--ink)]">
                {n.label}
              </Link>
            ))}
            <div className="my-1 border-t border-[var(--line)]" />
            {UTIL.map((n) => {
              const Icon = n.icon;
              return (
                <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 text-sm uppercase tracking-[0.13em] text-[var(--ink)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} /> {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
