import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RichHero, CtaBand } from '@/components/storefront/rich';

export const metadata: Metadata = { title: 'Design Consultation | GS Chairs', description: 'Book a complimentary one-on-one design consultation to plan your GS Chairs piece: wood, finish, and proportions.' };

const steps = [
  { n: '01', title: 'Tell us about your space', body: 'Share your room, how you live in it, and the look you’re after. Rough dimensions and a few inspiration images help, but aren’t required.' },
  { n: '02', title: 'We guide the choices', body: 'We recommend pieces, woods, and finishes for your space, and talk through custom sizes if you need them.' },
  { n: '03', title: 'Confirm with samples', body: 'Before you commit, we get wood and finish samples into your hands so the piece you order is exactly what you pictured.' },
];

export default function ConsultationPage() {
  return (
    <>
      <Header />
      <main>
        <RichHero
          image="/brand/room.png"
          eyebrow="Design Consultation"
          title="Design it with us."
          subtitle="A complimentary, one-on-one session to choose the wood, the finish, and the proportions for your home. No pressure, no obligation."
        />

        <section className="mx-auto max-w-[1000px] px-6 py-16 md:px-10 md:py-24">
          <div className="mb-12 text-center md:mb-16">
            <div className="eyebrow">How It Works</div>
            <h2 className="serif mt-3 text-[28px] font-normal text-[var(--ink)] md:text-[40px]">Three simple steps</h2>
          </div>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {steps.map((s) => (
              <div key={s.n}>
                <div className="serif text-[40px] leading-none text-[var(--walnut)]">{s.n}</div>
                <h3 className="serif mt-4 text-[22px] text-[var(--ink)]">{s.title}</h3>
                <p className="mt-3 text-[15px] leading-[1.85] font-light text-[var(--ink)]">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <CtaBand
          title="Ready to start?"
          body="Reach out and we’ll set up your consultation, usually within one business day."
          primary={{ href: '/contact', label: 'Contact Us' }}
          secondary={{ href: '/tables', label: 'Browse the Collection' }}
        />
      </main>
      <Footer />
    </>
  );
}
