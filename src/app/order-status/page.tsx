import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Order Status | GS Chairs', description: 'Check the status of your GS Chairs order and track your handcrafted piece from the workshop to your door.' };

export default function OrderStatusPage() {
  return (
    <ContentPage
      eyebrow="Customer Care"
      title="Order Status"
      intro="Every GS Chairs piece is built to order, so your order moves through a few clear stages. You can follow it from your account at any time."
      sections={[
        { heading: 'Where your order is', body: 'Sign in to your account to see your order’s current stage (confirmed, in production, shipping, or delivered) along with an estimated delivery date and a full status history.' },
        { heading: 'Production timeline', body: 'Because your piece is made by hand for you, most orders spend several weeks in the shop. We update the status as your piece moves through joinery, finishing, and final inspection.' },
        { heading: 'Shipping and delivery', body: 'Once your piece is finished, we arrange white-glove delivery and you will see tracking and scheduling details on your order. See the Delivery page for what to expect on the day.' },
      ]}
    >
      <div className="mt-10 rounded-lg bg-[var(--bone)] p-6">
        <p className="text-[15px] text-[var(--ink)]">Ready to check on your piece?</p>
        <Link href="/account/orders" className="mt-3 inline-block bg-[var(--espresso)] px-6 py-3 text-[12px] uppercase tracking-[0.18em] text-[#fffdfa]">View My Orders</Link>
      </div>
    </ContentPage>
  );
}
