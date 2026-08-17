import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Trade & Business | Keppler Commercial Furnishing', description: 'Keppler Commercial Furnishing works with designers, architects, and hospitality clients on trade pricing and contract orders.' };

export default function TradePage() {
  return (
    <ContentPage
      eyebrow="Resources"
      title="Trade & Business"
      intro="We partner with interior designers, architects, builders, and hospitality clients who want solid-wood furniture their own clients can rely on. If you specify furniture for a living, let’s work together."
      sections={[
        { heading: 'The trade program', body: 'Qualified trade members receive dedicated pricing, priority production scheduling, and a direct line to our team for specs, lead times, and custom requests.' },
        { heading: 'Contract & bulk orders', body: 'Furnishing a restaurant, office, or multiple units? We can build matched sets to a consistent spec and coordinate phased delivery to fit your project timeline.' },
        { heading: 'Custom work', body: 'Beyond our catalog, our builders can take on custom sizes and configurations for trade projects. Share your drawings or requirements and we’ll tell you what’s possible.' },
      ]}
    >
      <div className="mt-10">
        <Link href="/contact" className="inline-block bg-[var(--espresso)] px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-[#fffdfa]">Apply to the Trade Program</Link>
      </div>
    </ContentPage>
  );
}
