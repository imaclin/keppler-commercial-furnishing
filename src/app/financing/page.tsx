import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Financing | Keppler Commercial Furnishing', description: 'Flexible financing options to bring home a piece built to last a lifetime.' };

export default function FinancingPage() {
  return (
    <ContentPage
      eyebrow="Resources"
      title="Financing"
      intro="An heirloom piece is an investment that lasts decades. Financing lets you bring it home now and pay over time, so cost is never the reason to settle for furniture that won’t last."
      sections={[
        { heading: 'Pay over time', body: 'We offer straightforward monthly payment plans on qualifying orders, with clear terms and no surprises. You’ll see your options and any rates before you commit.' },
        { heading: 'How to apply', body: 'Applying takes just a few minutes and won’t affect your decision to browse. Once approved, you choose a plan at checkout and we begin building your piece.' },
        { heading: 'Questions about a plan', body: 'Not sure which option fits your project or budget? Reach out and we’ll walk you through the details so you can choose with confidence.' },
      ]}
    >
      <div className="mt-10">
        <Link href="/contact" className="inline-block border border-[var(--espresso)] px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-[var(--espresso)]">Ask About Financing</Link>
      </div>
    </ContentPage>
  );
}
