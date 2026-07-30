import Link from 'next/link';

const COLS = [
  { h: 'Our Company', links: [
    { label: 'About GS Chairs', href: '/about' },
    { label: 'Our Builders', href: '/our-builders' },
    { label: 'Craftsmanship', href: '/our-craft' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Contact', href: '/contact' },
  ] },
  { h: 'Customer Care', links: [
    { label: 'Order Status', href: '/order-status' },
    { label: 'Care Guide', href: '/care-guide' },
    { label: 'Warranty', href: '/warranty' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'Delivery', href: '/delivery' },
  ] },
  { h: 'Resources', links: [
    { label: 'FAQ', href: '/faq' },
    { label: 'Design Consultation', href: '/consultation' },
    { label: 'Order a Sample', href: '/order-a-sample' },
    { label: 'Trade & Business', href: '/trade' },
    { label: 'Financing', href: '/financing' },
  ] },
];

export function Footer() {
  return (
    <footer className="bg-[var(--espresso)] px-6 py-12 text-[#c3b8a6] md:px-14 md:py-16">
      <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="serif text-2xl tracking-[0.22em] text-[#fffdfa] whitespace-nowrap">GS CHAIRS</div>
          <p className="mt-4 max-w-[280px] text-[12.5px] leading-relaxed text-[#b4a895]">
            GS Chairs. Solid-wood chairs, handcrafted to order in America and built to be handed down.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.h}>
            <h4 className="mb-4 text-[11px] uppercase tracking-[0.2em] text-[#fffdfa]">{c.h}</h4>
            {c.links.map((l) => <Link key={l.href} href={l.href} className="block text-[13px] leading-[2.3] text-[#c3b8a6] hover:text-[#fffdfa]">{l.label}</Link>)}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-[1320px] border-t border-white/10 pt-6 text-[11px] tracking-[0.06em] text-[#9a8e7c]">
        &copy; {new Date().getFullYear()} GS Chairs
      </div>
    </footer>
  );
}
