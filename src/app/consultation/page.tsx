import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Design Consultation | HW', description: 'Book a complimentary one-on-one design consultation to plan your HW piece — wood, finish, and proportions.' };

export default function ConsultationPage() {
  return (
    <ContentPage
      eyebrow="Resources"
      title="Design Consultation"
      intro="Tell us about your space and how you live, and we’ll help you choose the wood, the finish, and the proportions. Every consultation is complimentary and with no obligation."
      sections={[
        { heading: 'How it works', body: 'We start with a conversation about your room, your routine, and the look you’re after. From there we recommend pieces, woods, and finishes, and we can talk through custom sizes if you need them.' },
        { heading: 'What to have ready', body: 'Rough room dimensions, a sense of your existing furniture and lighting, and any inspiration images are all helpful — but not required. We’ll guide you through the rest.' },
        { heading: 'Samples to confirm', body: 'Before you commit, we’ll get wood and finish samples into your hands so the piece you order is exactly what you pictured in your own space.' },
      ]}
    >
      <div className="mt-10 rounded-lg bg-[var(--bone)] p-6">
        <h2 className="serif text-[22px] text-[var(--ink)]">Ready to start?</h2>
        <p className="mt-2 text-[15px] leading-[1.8] text-[var(--ink)]">Reach out and we’ll set up your consultation, usually within one business day.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className="inline-block bg-[var(--espresso)] px-6 py-3 text-center text-[12px] uppercase tracking-[0.18em] text-[#fffdfa]">Contact Us</Link>
          <Link href="/tables" className="inline-block border border-[var(--espresso)] px-6 py-3 text-center text-[12px] uppercase tracking-[0.18em] text-[var(--espresso)]">Browse the Collection</Link>
        </div>
      </div>
    </ContentPage>
  );
}
