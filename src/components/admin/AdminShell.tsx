'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Layers, Trees, ShoppingBag, FileText, Users, MessageSquare, BarChart3,
  PanelLeftClose, PanelLeft, Search, LogOut, Settings, ShieldCheck, Globe, Menu, X,
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { CommandPalette } from '@/components/CommandPalette';
import { Notifications } from '@/components/admin/Notifications';
import type { CommandItem } from '@/lib/search';
import type { AttentionCounts } from '@/lib/analytics';

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
  { title: 'Admin', items: [
    { href: '/admin/staff', label: 'Staff', icon: ShieldCheck },
    { href: '/admin/web', label: 'Web Details', icon: Globe },
  ] },
];

export function AdminShell({
  email, initialCollapsed, commandItems, attention, children,
}: {
  email: string;
  initialCollapsed: boolean;
  commandItems: CommandItem[];
  attention: AttentionCounts;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const pathname = usePathname();

  const navItems: CommandItem[] = useMemo(
    () => GROUPS.flatMap((g) => g.items).map((it) => ({ id: `nav-${it.href}`, group: 'Go to', label: it.label, href: it.href })),
    [],
  );

  // Only collapse to icons on desktop; the mobile drawer always shows labels.
  const compact = isDesktop && collapsed;

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `hw_admin_nav=${next ? 'collapsed' : 'open'}; path=/; max-age=31536000`;
  }

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

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
    <div className="flex h-screen overflow-hidden bg-[var(--cream)]">
      {/* Mobile backdrop */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[248px] shrink-0 flex-col bg-[var(--espresso)] text-[#cdbfaf] transition-transform duration-200 md:static md:z-auto md:translate-x-0 md:transition-[width] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${compact ? 'md:w-[64px]' : 'md:w-[248px]'}`}
      >
        <div className={`flex items-center ${compact ? 'justify-center' : 'justify-between px-6'} h-[64px] shrink-0`}>
          {!compact && <span className="serif text-xl tracking-[0.18em] text-[#fffdfa] whitespace-nowrap">KEPPLER</span>}
          <button
            onClick={() => (isDesktop ? toggle() : setMobileOpen(false))}
            aria-label="Toggle sidebar"
            className="text-[#cdbfaf] hover:text-white"
          >
            {!isDesktop ? <X className="h-5 w-5" /> : compact ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <nav className="mt-2 flex-1 overflow-y-auto">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              {!compact && <div className="px-6 pb-1 text-[9.5px] uppercase tracking-[0.2em] text-[#7d7160]">{g.title}</div>}
              {g.items.map((it) => {
                const active = isActive(it.href);
                const Icon = it.icon;
                return (
                  <Link key={it.href} href={it.href} title={compact ? it.label : undefined}
                    className={`flex items-center gap-3 ${compact ? 'justify-center px-0' : 'px-6'} py-2.5 text-sm ${active ? 'bg-white/6 text-[#fffdfa] border-l-2 border-[var(--walnut)]' : 'text-[#c9bca9] hover:text-[#fffdfa]'}`}>
                    <Icon className="h-[18px] w-[18px] shrink-0" />{!compact && <span>{it.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Account footer: signed-in email + settings + sign out */}
        <div className="mt-auto shrink-0 border-t border-white/10 py-3">
          {compact ? (
            <Link href="/admin/settings" title="Settings" className="flex justify-center py-2 text-[#c9bca9] hover:text-[#fffdfa]">
              <Settings className="h-[18px] w-[18px]" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-6 pb-1">
              <span className="flex-1 truncate text-[11px] text-[#9c8f7d]">{email}</span>
              <Link href="/admin/settings" title="Settings" aria-label="Settings" className="text-[#9c8f7d] hover:text-[#fffdfa]">
                <Settings className="h-4 w-4" />
              </Link>
            </div>
          )}
          <form action="/auth/signout" method="post">
            <button title={compact ? 'Sign out' : undefined}
              className={`flex w-full items-center gap-3 ${compact ? 'justify-center px-0' : 'px-6'} py-2.5 text-sm text-[#c9bca9] hover:text-[#fffdfa]`}>
              <LogOut className="h-[18px] w-[18px] shrink-0" />{!compact && <span className="uppercase tracking-[0.12em] text-xs">Sign out</span>}
            </button>
          </form>
        </div>
      </aside>

      <div className="flex h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-[64px] shrink-0 items-center gap-3 border-b border-[var(--line)] bg-[var(--paper)] px-4 sm:px-6">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="text-[var(--ink)] md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block">
            <BackButton fallback="/admin" />
          </div>
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex flex-1 items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--cream)] px-3 py-2 text-sm text-[var(--stone)] hover:border-[var(--stone)] md:flex-none md:w-[min(28rem,50vw)]"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span>Search...</span>
            <kbd className="ml-auto hidden rounded border border-[var(--line)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto md:ml-0 md:flex-1 md:justify-self-end md:text-right">
            <div className="flex justify-end">
              <Notifications counts={attention} />
            </div>
          </div>
        </header>
        <div className="admin-body min-w-0 flex-1 overflow-y-auto">{children}</div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} navItems={navItems} entityItems={commandItems} />
    </div>
  );
}
