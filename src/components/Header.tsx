import Link from 'next/link';

const NAV = [
  { href: '/tables', label: 'Tables' },
  { href: '/chairs', label: 'Chairs' },
  { href: '/collections', label: 'Collections' },
  { href: '/our-craft', label: 'Our Craft' },
];

export function Header() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto grid max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center px-14 h-[86px]">
        <nav aria-label="Primary" className="flex gap-7 text-xs uppercase tracking-[0.13em]">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="text-[var(--ink)]">{n.label}</Link>)}
        </nav>
        <Link href="/" className="text-center">
          <span className="serif block text-4xl font-semibold tracking-[0.18em] text-[var(--espresso)] leading-none">HW</span>
          <span className="block text-[8.5px] uppercase tracking-[0.42em] text-[var(--stone)] mt-1">Heirloom Woodwork</span>
        </Link>
        <nav aria-label="Utility" className="flex justify-end gap-6 text-xs uppercase tracking-[0.13em]">
          <Link href="/search" className="text-[var(--ink)]">Search</Link>
          <Link href="/consultation" className="text-[var(--ink)]">Consultation</Link>
          <Link href="/account" className="text-[var(--ink)]">Account</Link>
        </nav>
      </div>
    </header>
  );
}
