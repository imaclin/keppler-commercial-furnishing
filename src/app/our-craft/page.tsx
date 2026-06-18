import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RichHero, Statement, FeatureRow, StatBand, Quote, CtaBand } from '@/components/storefront/rich';

export const metadata: Metadata = { title: 'Craftsmanship | HW', description: 'How HW furniture is built: traditional joinery, kiln-dried solid hardwood, and a hand-rubbed finish, made to last for generations.' };

export default function OurCraftPage() {
  return (
    <>
      <Header />
      <main>
        <RichHero
          image="/brand/craft.png"
          eyebrow="Our Craft"
          title="Built the way it was meant to be built."
          subtitle="Traditional joinery, solid hardwood, and a finish rubbed in by hand. No shortcuts, no compromise."
        />

        <Statement>
          Every piece is cut, joined, and finished by hand from a single intention: to outlast the people who buy it.
        </Statement>

        <FeatureRow
          image="/brand/hero.png"
          eyebrow="Step One"
          title="Joinery that gets stronger with use"
          body="We build with traditional mortise-and-tenon and hand-cut dovetail joints, fit by hand and locked for life. These joints tighten under load instead of loosening, which is why well-made wood furniture lasts generations while glued-and-stapled pieces fail in a few years."
        />
        <FeatureRow
          image="/demo/demo-table.png"
          imageRight
          eyebrow="Step Two"
          title="Solid hardwood, chosen board by board"
          body="Kiln-dried American hardwood, selected for grain and color one board at a time. No particle board, no MDF, no veneer hiding filler. The wood you see is the wood throughout — and it can be sanded, repaired, and refinished for decades."
        />
        <FeatureRow
          image="/brand/room.png"
          eyebrow="Step Three"
          title="A finish you can refresh, not replace"
          body="Each piece is sanded smooth and finished by hand with oils and topcoats that protect the surface while letting the grain show. A hand-rubbed finish deepens with age, and when it needs attention it can be refreshed in place rather than stripped."
        />

        <StatBand
          stats={[
            { value: '100%', label: 'Solid hardwood' },
            { value: 'By hand', label: 'Cut & finished' },
            { value: 'Lifetime', label: 'Craftsmanship warranty' },
            { value: 'Made to order', label: 'Built for you' },
          ]}
        />

        <Quote text="We build the way furniture was meant to be built, and we sign our work." attribution="The HW Workshop" />

        <CtaBand
          title="See the craft for yourself."
          body="Explore the collection, or book a consultation to choose the wood, finish, and proportions for your space."
          primary={{ href: '/tables', label: 'Explore the Collection' }}
          secondary={{ href: '/consultation', label: 'Book a Consultation' }}
        />
      </main>
      <Footer />
    </>
  );
}
