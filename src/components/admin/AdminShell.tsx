'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Layers, Trees, ShoppingBag, FileText, Users, MessageSquare, BarChart3,
  PanelLeftClose, PanelLeft, Search, Plus, LogOut,
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { CommandPalette } from '@/components/CommandPalette';
import type { CommandItem } from '@/lib/search';

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

export function AdminShell({
  email, initialCollapsed, commandItems, children,
}: {
  email: string;
  initialCollapsed: boolean;
  commandItems: CommandItem[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();

  const navItems: CommandItem[] = useMemo(
    () => GROUPS.flatMap((g) => g.items).map((it) => ({ id: `nav-${it.href}`, group: 'Go to', label: it.label, href: it.href })),
    [],
  );

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `hw_admin_nav=${next ? 'collapsed' : 'open'}; path=/; max-age=31536000`;
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-[var(--cream)]">
      <aside className={`${collapsed ? 'w-[64px]' : 'w-[248px]'} flex shrink-0 flex-col bg-[var(--espresso)] text-[#cdbfaf] transition-[width] duration-200`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-6'} h-[64px]`}>
          {!collapsed && <span className="serif text-2xl tracking-[0.2em] text-[#fffdfa]">HW</span>}
          <button onClick={toggle} aria-label="Toggle sidebar" className="text-[#cdbfaf] hover:text-white">
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <nav className="mt-2 flex-1">
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

        {/* Account footer: signed-in email + sign out */}
        <div className="mt-auto border-t border-white/10 py-3">
          {!collapsed && <div className="truncate px-6 pb-1 text-[11px] text-[#9c8f7d]">{email}</div>}
          <form action="/auth/signout" method="post">
            <button title={collapsed ? 'Sign out' : undefined}
              className={`flex w-full items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-6'} py-2.5 text-sm text-[#c9bca9] hover:text-[#fffdfa]`}>
              <LogOut className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span className="uppercase tracking-[0.12em] text-xs">Sign out</span>}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] items-center gap-4 border-b border-[var(--line)] bg-[var(--paper)] px-6">
          <BackButton fallback="/admin" />
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex flex-1 max-w-md items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--stone)] hover:border-[var(--stone)]"
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-auto rounded border border-[var(--line)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
          <Link href="/admin/products/new" className="flex shrink-0 items-center gap-1 bg-[var(--espresso)] px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-[#fffdfa]"><Plus className="h-3.5 w-3.5" /> New Product</Link>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} navItems={navItems} entityItems={commandItems} />
    </div>
  );
}
