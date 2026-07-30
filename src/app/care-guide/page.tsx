import type { Metadata } from 'next';
import { ContentPage } from '@/components/storefront/ContentPage';

export const metadata: Metadata = { title: 'Care Guide | GS Chairs', description: 'How to care for your solid-wood GS Chairs chair so it lasts for generations.' };

export default function CareGuidePage() {
  return (
    <ContentPage
      eyebrow="Customer Care"
      title="Care Guide"
      intro="Solid wood is forgiving and made to be lived with. A little routine care keeps your piece looking its best and lets it age beautifully over the years."
      sections={[
        { heading: 'Everyday care', body: 'Wipe spills promptly with a soft, slightly damp cloth, then dry. Use trivets, coasters, and placemats for hot dishes and wet glasses, and lift objects rather than dragging them across the surface.' },
        { heading: 'Cleaning', body: 'For routine cleaning, a soft cloth with a little water is enough. Avoid all-purpose sprays, ammonia, and silicone-based polishes, which can cloud or build up on a hand-rubbed finish.' },
        { heading: 'Conditioning the finish', body: 'For oil-finished pieces, reapply a thin coat of furniture oil once or twice a year, or whenever the surface looks dry. This refreshes the protection and revives the grain.' },
        { heading: 'Light and humidity', body: 'Wood moves with the seasons. Keep pieces out of prolonged direct sunlight and away from heat vents, and aim for stable indoor humidity to minimize natural expansion and contraction.' },
      ]}
    />
  );
}
