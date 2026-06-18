import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Craftsmanship | HW', description: 'How HW furniture is built: traditional joinery, kiln-dried hardwood, and a hand-rubbed finish.' };

export default function OurCraftPage() {
  return (
    <ContentPage
      eyebrow="Our Craft"
      title="Craftsmanship"
      intro="We build the way furniture was meant to be built, with methods that have outlasted every trend. Here is what goes into a piece before it ever reaches your home."
      sections={[
        { heading: 'Joinery', body: 'We use traditional mortise-and-tenon and dovetail joinery, cut to fit and glued for strength. These joints get tighter under load, not looser, which is why well-made wood furniture lasts generations while glued-and-stapled pieces fail in a few years.' },
        { heading: 'Materials', body: 'Solid kiln-dried American hardwood, chosen board by board for grain and color. No particle board, no MDF, no veneer hiding filler. The wood you see is the wood throughout.' },
        { heading: 'Finish', body: 'Each piece is sanded smooth and finished by hand with oils and topcoats that protect the surface while letting the grain show. A hand-rubbed finish deepens with age and can be refreshed rather than stripped.' },
        { heading: 'Made to order', body: 'Because we build each piece for a specific customer, you choose the wood species, the finish, and the size. Nothing sits in a warehouse losing its character before it gets to you.' },
      ]}
    />
  );
}
