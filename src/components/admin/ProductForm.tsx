'use client';

import { useState } from 'react';
import { uploadImageAction } from '@/app/actions/upload';
import { saveProductAction, type SaveProductState } from '@/app/actions/catalog';
import { slugify } from '@/lib/format';
import type { Collection, WoodSpecies, Finish } from '@/lib/types';
import type { ProductInput, ProductDetail } from '@/lib/catalog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type SizeRow = { label: string; seats: string; price_delta: string };

export function ProductForm({
  product, collections, woods, finishes,
}: {
  product: ProductDetail | null;
  collections: Collection[];
  woods: WoodSpecies[];
  finishes: Finish[];
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [category, setCategory] = useState<'table' | 'chair'>(product?.category ?? 'table');
  const [collectionId, setCollectionId] = useState(product?.collection_id ?? '');
  const [shortDesc, setShortDesc] = useState(product?.short_description ?? '');
  const [story, setStory] = useState(product?.story ?? '');
  const [basePrice, setBasePrice] = useState(product ? String(product.base_price_cents / 100) : '');
  const [leadTime, setLeadTime] = useState(product?.lead_time_weeks ? String(product.lead_time_weeks) : '');
  const [region, setRegion] = useState(product?.region ?? '');
  const [lengthIn, setLengthIn] = useState(product?.length_in != null ? String(product.length_in) : '');
  const [widthIn, setWidthIn] = useState(product?.width_in != null ? String(product.width_in) : '');
  const [heightIn, setHeightIn] = useState(product?.height_in != null ? String(product.height_in) : '');
  const [weightLb, setWeightLb] = useState(product?.weight_lb != null ? String(product.weight_lb) : '');
  const [status, setStatus] = useState<'draft' | 'published'>(product?.status ?? 'draft');
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [woodIds, setWoodIds] = useState<string[]>(product?.woodIds.map((w) => w.wood_id) ?? []);
  const [finishIds, setFinishIds] = useState<string[]>(product?.finishIds.map((f) => f.finish_id) ?? []);
  // Size variants are no longer edited here (physical Dimensions replaced that UI),
  // but we preserve any existing variants so saving a product doesn't wipe them.
  const [sizes] = useState<SizeRow[]>(
    product?.sizes.map((s) => ({ label: s.label, seats: s.seats ? String(s.seats) : '', price_delta: String(s.price_delta_cents / 100) })) ?? [],
  );
  const [imageUrls, setImageUrls] = useState<string[]>(product?.images.map((i) => i.url) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadImageAction(fd);
    if ('error' in res) setError(res.error);
    else setImageUrls((prev) => [...prev, res.url]);
    e.target.value = '';
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const input: ProductInput = {
      slug: slug.trim() || slugify(name),
      name: name.trim(), category, collection_id: collectionId || null,
      short_description: shortDesc.trim() || null, story: story.trim() || null,
      base_price_cents: Math.round(parseFloat(basePrice || '0') * 100),
      lead_time_weeks: leadTime ? parseInt(leadTime, 10) : null,
      region: region.trim() || null, status, featured,
      length_in: lengthIn.trim() ? parseFloat(lengthIn) : null,
      width_in: widthIn.trim() ? parseFloat(widthIn) : null,
      height_in: heightIn.trim() ? parseFloat(heightIn) : null,
      weight_lb: weightLb.trim() ? parseFloat(weightLb) : null,
      woodIds, finishIds,
      sizes: sizes.filter((s) => s.label.trim()).map((s) => ({
        label: s.label.trim(), seats: s.seats ? parseInt(s.seats, 10) : null,
        price_delta_cents: Math.round(parseFloat(s.price_delta || '0') * 100),
      })),
      imageUrls,
    };
    const res: SaveProductState = await saveProductAction(product?.id ?? null, input);
    if (res && 'error' in res) { setError(res.error); setBusy(false); }
    // on success the action redirects; no need to reset busy
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Main details */}
      <div className="space-y-5 lg:col-span-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => { setName(e.target.value); if (!product) setSlug(slugify(e.target.value)); }} /></div>
          <div className="space-y-2"><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Category</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value as 'table' | 'chair')} className="h-9 w-full border border-[var(--line)] px-2 text-sm">
              <option value="table">Table</option><option value="chair">Chair</option>
            </select>
          </div>
          <div className="space-y-2"><Label>Collection</Label>
            <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="h-9 w-full border border-[var(--line)] px-2 text-sm">
              <option value="">None</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Base price ($)</Label><Input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} inputMode="decimal" /></div>
        </div>
        <div className="space-y-2"><Label>Short description</Label><Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} /></div>
        <div className="space-y-2"><Label>Story</Label><Textarea value={story} onChange={(e) => setStory(e.target.value)} rows={3} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Lead time (weeks)</Label><Input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} inputMode="numeric" /></div>
          <div className="space-y-2"><Label>Region</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Holmes County, Ohio" /></div>
        </div>

        <div className="space-y-2"><Label>Dimensions</Label>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1"><span className="text-[11px] text-[var(--stone)]">Length (in)</span><Input value={lengthIn} onChange={(e) => setLengthIn(e.target.value)} inputMode="decimal" placeholder="84" /></div>
            <div className="space-y-1"><span className="text-[11px] text-[var(--stone)]">Width (in)</span><Input value={widthIn} onChange={(e) => setWidthIn(e.target.value)} inputMode="decimal" placeholder="42" /></div>
            <div className="space-y-1"><span className="text-[11px] text-[var(--stone)]">Height (in)</span><Input value={heightIn} onChange={(e) => setHeightIn(e.target.value)} inputMode="decimal" placeholder="30" /></div>
            <div className="space-y-1"><span className="text-[11px] text-[var(--stone)]">Weight (lb)</span><Input value={weightLb} onChange={(e) => setWeightLb(e.target.value)} inputMode="decimal" placeholder="180" /></div>
          </div>
        </div>

        <div className="space-y-2"><Label>Wood species offered</Label>
          <div className="flex flex-wrap gap-2">
            {woods.map((w) => (
              <button type="button" key={w.id} onClick={() => toggle(woodIds, setWoodIds, w.id)}
                className={`flex items-center gap-2 border px-3 py-1.5 text-sm ${woodIds.includes(w.id) ? 'border-[var(--espresso)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}>
                <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: w.swatch_color }} />{w.name}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2"><Label>Finishes offered</Label>
          <div className="flex flex-wrap gap-2">
            {finishes.map((f) => (
              <button type="button" key={f.id} onClick={() => toggle(finishIds, setFinishIds, f.id)}
                className={`flex items-center gap-2 border px-3 py-1.5 text-sm ${finishIds.includes(f.id) ? 'border-[var(--espresso)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}>
                <span className="inline-block h-3.5 w-3.5 rounded-full" style={{ background: f.swatch_color }} />{f.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar: media + publish */}
      <div className="space-y-5">
        <div className="space-y-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
          <Label>Images</Label>
          <div className="flex flex-wrap gap-3">
            {imageUrls.map((u) => (
              <div key={u} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-24 w-24 max-w-none rounded object-cover border border-[var(--line)]" />
                <button type="button" onClick={() => setImageUrls((p) => p.filter((x) => x !== u))} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[var(--espresso)] text-xs text-white">x</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} className="text-sm" />
        </div>

        <div className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
          <div className="flex items-center gap-2 text-sm">Status:
            <select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')} className="h-9 border border-[var(--line)] px-2">
              <option value="draft">Draft</option><option value="published">Published</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={save} disabled={busy} className="w-full">{busy ? 'Saving...' : 'Save product'}</Button>
        </div>
      </div>
    </div>
  );
}
