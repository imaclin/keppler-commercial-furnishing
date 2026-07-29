import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Warranty | GS Chairs', description: 'The GS Chairs warranty covers materials and craftsmanship on every handcrafted piece.' };

export default function WarrantyPage() {
  return (
    <ContentPage
      eyebrow="Customer Care"
      title="Warranty"
      intro="We sign our work and we stand behind it. Every GS Chairs piece is warranted against defects in materials and craftsmanship for the life of the original owner."
      sections={[
        { heading: 'What’s covered', body: 'Structural defects in the wood and joinery, and workmanship issues such as joints that loosen or finishes that fail under normal indoor use. If something we built doesn’t hold up the way it should, we’ll make it right.' },
        { heading: 'What’s not covered', body: 'Normal aging and patina, changes in color from sunlight, and the natural movement of solid wood with humidity. These are features of real wood, not defects. Damage from misuse, accidents, alterations, or improper care is also excluded.' },
        { heading: 'How to make a claim', body: 'Reach out with your order details and a few photos of the issue. We’ll assess it and arrange a repair, replacement, or refinish as appropriate. Most issues with solid wood can be repaired rather than replaced.' },
      ]}
    >
      <div className="mt-10">
        <Link href="/contact" className="inline-block border border-[var(--espresso)] px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-[var(--espresso)]">Start a Warranty Claim</Link>
      </div>
    </ContentPage>
  );
}
