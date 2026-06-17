'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Layers, Trees, ShoppingBag, FileText, Users, MessageSquare, BarChart3,
  PanelLeftClose, PanelLeft, Search, Plus,
} from 'lucide-react';

const GROUPS = [
  { title: 'Overview', items: [{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'Catalog', items: [
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/collections', label: 'Collections', icon: Layers },
    { href: '/admin/woods', label: 'Wood & Finishes', icon: Trees },
  ] },
  { title: 'Sales', items: [
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/quotes', label: 'Quotes', icon: FileText },
  ] },
  { title: 'People', items: [
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  ] },
  { title: 'Insights', items: [{ href: '/admin/reports', label: 'Reports', icon: BarChart3 }] },
];

export function AdminShell({ email, initialCollapsed, children }: { email: string; initialCollapsed: boolean; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();
  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `hw_admin_nav=${next ? 'collapsed' : 'open'}; path=/; max-age=31536000`;
  }
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  return (
    <div className="flex min-h-screen bg-[var(--cream)]">
      <aside className={`${collapsed ? 'w-[64px]' : 'w-[248px]'} shrink-0 bg-[var(--espresso)] text-[#cdbfaf] transition-[width] duration-200`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-6'} h-[64px]`}>
          {!collapsed && <span className="serif text-2xl tracking-[0.2em] text-[#fffdfa]">HW</span>}
          <button onClick={toggle} aria-label="Toggle sidebar" className="text-[#cdbfaf] hover:text-white">
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <nav className="mt-2">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              {!collapsed && <div className="px-6 pb-1 text-[9.5px] uppercase tracking-[0.2em] text-[#7d7160]">{g.title}</div>}
              {g.items.map((it) => {
                const active = isActive(it.href);
                const Icon = it.icon;
                return (
                  <Link key={it.href} href={it.href} title={collapsed ? it.label : undefined}
                    className={`flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-6'} py-2.5 text-sm ${active ? 'bg-white/6 text-[#fffdfa] border-l-2 border-[var(--walnut)]' : 'text-[#c9bca9] hover:text-[#fffdfa]'}`}>
                    <Icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>{it.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--paper)] px-6">
          <form action="/admin/orders" className="flex items-center gap-2 text-[var(--stone)]">
            <Search className="h-4 w-4" />
            <input name="q" placeholder="Search orders, customers..." className="w-64 max-w-[40vw] bg-transparent text-sm outline-none placeholder:text-[var(--stone)]" />
          </form>
          <div className="flex items-center gap-4">
            <Link href="/admin/products/new" className="flex items-center gap-1 bg-[var(--espresso)] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-[#fffdfa]"><Plus className="h-3.5 w-3.5" /> New Product</Link>
            <span className="text-xs text-[var(--stone)]">{email}</span>
            <form action="/auth/signout" method="post"><button className="text-xs uppercase tracking-[0.12em] text-[var(--ink)]">Sign out</button></form>
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
