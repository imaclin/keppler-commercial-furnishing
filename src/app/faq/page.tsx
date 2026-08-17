import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'FAQ | Keppler Commercial Furnishing', description: 'Answers to common questions about Keppler furniture, ordering, wood, delivery, and care.' };

export default function FaqPage() {
  return (
    <ContentPage
      eyebrow="Resources"
      title="Frequently Asked Questions"
      intro="A few of the questions we hear most often. If yours isn’t here, reach out. We’re happy to help."
      sections={[
        { heading: 'Is everything really solid wood?', body: 'Yes. Our chairs are built from solid American hardwood throughout: no particle board, MDF, or veneer over filler.' },
        { heading: 'How long does an order take?', body: 'Each piece is built to order, so most orders take several weeks in production. You’ll see an estimated delivery date on your order and can track its stage from your account.' },
        { heading: 'Can I choose the wood and finish?', body: 'Absolutely. On each product page you choose the wood species, finish, and size. We recommend ordering samples first so you can see and feel the options in your own light.' },
        { heading: 'Do you offer samples?', body: 'Yes. You can request wood and finish samples, and they’re yours to keep. See the Order a Sample page for details.' },
        { heading: 'How much is delivery?', body: 'White-glove delivery is complimentary on every piece within the continental United States. Our team places the piece in your room and removes all packaging.' },
        { heading: 'Can you build something custom?', body: 'Often, yes. If you have a size or configuration in mind, book a design consultation and we’ll see what’s possible with our builders.' },
        { heading: 'How do I care for my piece?', body: 'Solid wood is easy to live with. Wipe spills promptly, use coasters and trivets, and refresh oil finishes once or twice a year. Our Care Guide has the details.' },
      ]}
    />
  );
}
