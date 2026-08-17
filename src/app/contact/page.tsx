import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { ContentPage } from '@/components/storefront/ContentPage';
import { getSiteSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Contact | Keppler Commercial Furnishing', description: 'Get in touch with Keppler Commercial Furnishing about a piece, a custom commission, or a design consultation.' };

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const s = await getSiteSettings();
  return (
    <ContentPage
      eyebrow="Customer Care"
      title="Contact"
      intro="Questions about a piece, a custom commission, or your order? We would love to hear from you. A real person will get back to you, usually within one business day."
    >
      <div className="mt-10 space-y-5">
        {s.contact_email && (
          <a href={`mailto:${s.contact_email}`} className="flex items-center gap-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 hover:border-[var(--walnut)]">
            <Mail className="h-5 w-5 shrink-0 text-[var(--walnut)]" />
            <span><span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">Email</span><span className="text-[var(--ink)]">{s.contact_email}</span></span>
          </a>
        )}
        {s.contact_phone && (
          <a href={`tel:${s.contact_phone.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 hover:border-[var(--walnut)]">
            <Phone className="h-5 w-5 shrink-0 text-[var(--walnut)]" />
            <span><span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">Phone</span><span className="text-[var(--ink)]">{s.contact_phone}</span></span>
          </a>
        )}
        {s.address && (
          <div className="flex items-center gap-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5">
            <MapPin className="h-5 w-5 shrink-0 text-[var(--walnut)]" />
            <span><span className="block text-[11px] uppercase tracking-[0.14em] text-[var(--stone)]">Workshop</span><span className="text-[var(--ink)]">{s.address}</span></span>
          </div>
        )}
      </div>

      <div className="mt-10 rounded-lg bg-[var(--bone)] p-6">
        <h2 className="serif text-[22px] text-[var(--ink)]">Planning a piece?</h2>
        <p className="mt-2 text-[15px] leading-[1.8] text-[var(--ink)]">If you are designing a room or want help choosing wood, finish, and proportions, book a one-on-one design consultation.</p>
        <Link href="/consultation" className="mt-4 inline-block bg-[var(--espresso)] px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-[#fffdfa]">Book a Consultation</Link>
      </div>
    </ContentPage>
  );
}
