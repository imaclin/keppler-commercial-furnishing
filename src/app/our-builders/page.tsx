import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RichHero, Statement, FeatureRow, Quote, CtaBand } from '@/components/storefront/rich';

export const metadata: Metadata = { title: 'Our Builders | GS Chairs', description: 'Meet the American craftsmen who build every GS Chairs piece by hand in small workshops.' };

export default function OurBuildersPage() {
  return (
    <>
      <Header />
      <main>
        <RichHero
          image="/brand/craft.png"
          eyebrow="Our Company"
          title="Made by hands that have done it for generations."
          subtitle="Every GS Chairs piece is built by a real person in a small American workshop, not stamped out on a line."
        />

        <Statement>
          One set of hands owns each piece from rough lumber to final finish.
        </Statement>

        <FeatureRow
          image="/brand/hero.png"
          eyebrow="The Makers"
          title="Independent woodworkers, not a factory"
          body="We partner with a tight circle of independent craftsmen rather than a production line. Each maker owns their piece end to end, which means one person is accountable for the whole chair, and proud to put their name on it."
        />
        <FeatureRow
          image="/demo/demo-chair.png"
          imageRight
          eyebrow="Generational Skill"
          title="A trade learned the long way"
          body="Many of our builders learned from their fathers, who learned from theirs. Hand-cut joinery and a feel for how wood moves with the seasons are not things you can rush. Our makers have spent decades earning them."
        />

        <Quote text="They build small on purpose, so every piece gets the attention it deserves." attribution="On the GS Chairs Workshops" />

        <CtaBand
          title="Own a piece of the work."
          body="Explore the collection, or talk with us about a custom commission."
          primary={{ href: '/chairs', label: 'Explore the Collection' }}
          secondary={{ href: '/consultation', label: 'Book a Consultation' }}
        />
      </main>
      <Footer />
    </>
  );
}
