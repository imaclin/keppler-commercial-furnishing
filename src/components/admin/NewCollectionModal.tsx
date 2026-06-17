'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import { addCollectionAction } from '@/app/actions/catalog';
import { uploadImageAction } from '@/app/actions/upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function NewCollectionModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [heroUrl, setHeroUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(''); setDescription(''); setHeroUrl(''); setError(null);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadImageAction(fd);
    if ('error' in res) setError(res.error);
    else setHeroUrl(res.url);
    e.target.value = '';
  }

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set('name', name.trim());
    fd.set('description', description.trim());
    fd.set('hero_image_url', heroUrl);
    await addCollectionAction(fd);
    setBusy(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-[var(--espresso)] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#fffdfa]"
      >
        <Plus className="h-3.5 w-3.5" /> New Collection
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="serif text-2xl text-[var(--ink)]">New collection</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-[var(--stone)] hover:text-[var(--ink)]"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="The Heirloom Collection" autoFocus /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Short description (optional)" /></div>
              <div className="space-y-2">
                <Label>Hero image</Label>
                {heroUrl ? (
                  <div className="relative w-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroUrl} alt="" className="h-28 w-44 max-w-none rounded object-cover border border-[var(--line)]" />
                    <button type="button" onClick={() => setHeroUrl('')} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[var(--espresso)] text-xs text-white">x</button>
                  </div>
                ) : (
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} className="text-sm" />
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit} disabled={busy || !name.trim()}>{busy ? 'Creating...' : 'Create collection'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
