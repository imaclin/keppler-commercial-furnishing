import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Returns & Exchanges | HW', description: 'How returns, exchanges, and transit-damage claims work for made-to-order HW furniture.' };

export default function ReturnsPage() {
  return (
    <ContentPage
      eyebrow="Customer Care"
      title="Returns & Exchanges"
      intro="Because each piece is built to order in your chosen wood and finish, our return policy is a little different from mass-market furniture. Here is how it works."
      sections={[
        { heading: 'Made-to-order pieces', body: 'Finished, made-to-order pieces are not eligible for standard return, since they are built specifically for you. We make this clear up front and help you get the configuration right before production begins.' },
        { heading: 'Before production', body: 'Plans change. If you need to cancel or adjust your order before it enters production, contact us as soon as possible and we’ll do everything we can to accommodate the change.' },
        { heading: 'Damaged or defective on arrival', body: 'If your piece arrives damaged or has a workmanship defect, we’ll repair or replace it at no cost. Just contact us within 7 days of delivery with photos and we’ll take it from there.' },
        { heading: 'Wood samples', body: 'Wood and finish samples are yours to keep. We encourage ordering samples before you commit, so the piece you receive is exactly what you expected.' },
      ]}
    >
      <div className="mt-10">
        <Link href="/contact" className="inline-block border border-[var(--espresso)] px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-[var(--espresso)]">Contact Us About an Order</Link>
      </div>
    </ContentPage>
  );
}
