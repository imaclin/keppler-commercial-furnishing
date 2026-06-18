import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RichHero, Statement, FeatureRow, StatBand, CtaBand } from '@/components/storefront/rich';

export const metadata: Metadata = { title: 'About HW', description: 'HW builds solid-wood tables and chairs, handcrafted to order in America and made to be handed down.' };

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <RichHero
          image="/brand/room.png"
          eyebrow="Our Company"
          title="Furniture meant to be handed down."
          subtitle="Solid-wood tables and chairs, built to order by American craftsmen and finished by hand."
        />

        <Statement>
          We started with a simple conviction: furniture should be made well enough to outlast the people who buy it.
        </Statement>

        <FeatureRow
          image="/brand/craft.png"
          eyebrow="Our Story"
          title="A modern way to buy old-world craft"
          body="HW grew out of a partnership with small American workshops that have built furniture the same careful way for generations. We pair that craft tradition with a straightforward way to buy: choose your piece, your wood, and your finish, and we build it for you."
        />
        <FeatureRow
          image="/demo/demo-table3.png"
          imageRight
          eyebrow="What We Make"
          title="Dining tables and chairs, done right"
          body="Solid American hardwood, traditional joinery, and a hand-rubbed finish. No particle board, no veneers over filler, no shortcuts. Every piece is built one at a time and signed by the person who made it."
        />

        <StatBand
          stats={[
            { value: 'American', label: 'Made & sourced' },
            { value: 'One at a time', label: 'Built to order' },
            { value: 'Solid wood', label: 'Never particle board' },
            { value: 'Generations', label: 'Built to last' },
          ]}
        />

        <CtaBand
          title="Build something that lasts."
          body="Browse the collection or talk with us about the right piece for your home."
          primary={{ href: '/tables', label: 'Explore the Collection' }}
          secondary={{ href: '/our-craft', label: 'See Our Craft' }}
        />
      </main>
      <Footer />
    </>
  );
}
