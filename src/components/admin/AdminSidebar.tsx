import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/woods', label: 'Wood & Finishes' },
];

export function AdminSidebar({ email }: { email: string }) {
  return (
    <aside className="flex w-[248px] flex-col bg-[var(--espresso)] py-8 text-[#cdbfaf]">
      <div className="serif px-7 text-center text-3xl font-semibold tracking-[0.2em] text-[#fffdfa]">HW</div>
      <div className="mb-8 text-center text-[8px] uppercase tracking-[0.4em] text-[#8a7d6c]">Admin</div>
      <nav className="flex flex-col">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="px-7 py-2.5 text-sm text-[#c9bca9] hover:text-[#fffdfa]">{n.label}</Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 px-7 pt-4 text-xs text-[#c9bca9]">{email}</div>
    </aside>
  );
}
