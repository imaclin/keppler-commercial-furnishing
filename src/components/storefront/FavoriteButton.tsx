'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toggleFavoriteAction } from '@/app/actions/account';
import { Button } from '@/components/ui/button';

export function FavoriteButton({ productId, initialFavorited }: { productId: string; initialFavorited: boolean }) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await toggleFavoriteAction(productId);
    setBusy(false);
    if ('needsAuth' in res) { router.push('/login'); return; }
    if ('error' in res) { return; }
    setFavorited(res.favorited);
  }

  return (
    <Button variant="outline" className="w-full" onClick={toggle} disabled={busy}>
      {favorited ? 'Saved to Favorites' : 'Add to Favorites'}
    </Button>
  );
}
