import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Sustainability | HW', description: 'Responsibly sourced hardwood, low-waste workshops, and furniture built to last for generations.' };

export default function SustainabilityPage() {
  return (
    <ContentPage
      eyebrow="Our Company"
      title="Sustainability"
      intro="The most sustainable piece of furniture is the one you never have to replace. That belief shapes how we source our wood, run our shops, and build our pieces."
      sections={[
        { heading: 'Responsibly sourced hardwood', body: 'We use solid North American hardwoods from suppliers who manage their forests for the long term. Domestic lumber also means a far shorter trip from forest to workshop than imported, container-shipped furniture.' },
        { heading: 'Built to last', body: 'Disposable furniture is an environmental problem. Our pieces are built with repairable joinery and refreshable finishes so they can be maintained for decades and handed down, instead of ending up in a landfill.' },
        { heading: 'Low-waste workshops', body: 'Our builders work efficiently with the material they have, using offcuts where they can and reclaiming sawdust and scrap. Building to order also means we are not mass-producing inventory that may never sell.' },
      ]}
    />
  );
}
