import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Delivery | GS Chairs', description: 'Complimentary white-glove delivery on every GS Chairs piece, scheduled around you.' };

export default function DeliveryPage() {
  return (
    <ContentPage
      eyebrow="Customer Care"
      title="Delivery"
      intro="Your piece spent weeks being built by hand. We make sure it arrives the same way it left the shop, with complimentary white-glove delivery on every order."
      sections={[
        { heading: 'White-glove service', body: 'Our delivery team brings your piece inside, places it in the room of your choice, unpacks and inspects it, and removes all the packaging. You don’t lift a thing.' },
        { heading: 'Lead times', body: 'Because everything is made to order, plan on several weeks from order to delivery while your piece is in production. You’ll see an estimated delivery date on your order and we’ll keep it updated.' },
        { heading: 'Scheduling', body: 'Once your piece passes final inspection, we’ll reach out to arrange a delivery window that works for you. You’ll receive tracking and a confirmed appointment before the truck arrives.' },
        { heading: 'Where we deliver', body: 'We currently offer white-glove delivery across the continental United States. If you’re outside our standard area, contact us and we’ll find a way to get your piece to you.' },
      ]}
    />
  );
}
