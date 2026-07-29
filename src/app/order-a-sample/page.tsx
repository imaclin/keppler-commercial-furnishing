import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Order a Sample | GS Chairs', description: 'Order wood and finish samples to see and feel your GS Chairs piece before you commit.' };

export default function OrderASamplePage() {
  return (
    <ContentPage
      eyebrow="Resources"
      title="Order a Sample"
      intro="Wood is a natural material, and screens only tell you so much. Order samples to see the grain and feel the finish in your own light before you order a full piece."
      sections={[
        { heading: 'How to order samples', body: 'Open any product, choose the wood and finish you’re considering, and request a sample right from the configurator. You can request more than one to compare side by side.' },
        { heading: 'What you’ll receive', body: 'A finished sample of the wood species and finish you selected, so you can judge color, grain, and sheen against your floors, walls, and existing furniture.' },
        { heading: 'Yours to keep', body: 'Samples are complimentary and yours to keep. There’s no obligation to order, and no need to send anything back.' },
      ]}
    >
      <div className="mt-10">
        <Link href="/tables" className="inline-block bg-[var(--espresso)] px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-[#fffdfa]">Browse Pieces to Sample</Link>
      </div>
    </ContentPage>
  );
}
