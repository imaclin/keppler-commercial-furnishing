import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Our Builders | HW', description: 'Meet the American craftsmen who build every HW piece by hand in small workshops.' };

export default function OurBuildersPage() {
  return (
    <ContentPage
      eyebrow="Our Company"
      title="Our Builders"
      intro="Every HW piece is made by a real person in a small American workshop, not stamped out on a line. Our builders learned the trade the long way, and it shows in the work."
      sections={[
        { heading: 'The hands behind the work', body: 'We partner with a tight circle of independent woodworkers rather than a factory. Each maker owns their piece from rough lumber to final finish, which means one set of hands is accountable for the whole table or chair.' },
        { heading: 'Generational skill', body: 'Many of our builders learned from their fathers, who learned from theirs. Mortise-and-tenon joinery, hand-cut dovetails, and a feel for how wood moves with the seasons are not things you can rush, and our makers have spent decades earning them.' },
        { heading: 'Small by design', body: 'Working small keeps the quality high. Our builders take on a limited number of commissions at a time so every piece gets the attention it deserves, which is also why we build to order instead of to a warehouse.' },
      ]}
    />
  );
}
