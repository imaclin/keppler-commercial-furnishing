import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'About HW', description: 'HW builds solid-wood tables and chairs, handcrafted to order in America and made to be handed down.' };

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Our Company"
      title="About HW"
      intro="HW makes solid-wood tables and chairs, built to order by American craftsmen and finished by hand. We started with a simple conviction: furniture should be made well enough to outlast the people who buy it."
      sections={[
        { heading: 'Our story', body: 'HW grew out of a partnership with small workshops that have built furniture the same careful way for generations. We pair that craft tradition with a straightforward way to buy: choose your piece, your wood, and your finish, and we build it for you.' },
        { heading: 'What we make', body: 'Dining tables and chairs in solid American hardwood. No particle board, no veneers over filler, no shortcuts. Every joint is cut to last, and every surface is finished by hand.' },
        { heading: 'Our promise', body: 'We build one piece at a time, we stand behind it, and we sign our work. When you buy from HW, you are buying something meant to be repaired rather than replaced, and passed down rather than discarded.' },
      ]}
    />
  );
}
