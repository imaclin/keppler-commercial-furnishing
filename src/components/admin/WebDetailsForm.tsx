'use client';

import { useState } from 'react';
import { Search, Building2 } from 'lucide-react';
import { updateSiteSettingsAction } from '@/app/actions/settings';
import type { SiteSettings } from '@/lib/settings';
import { uploadImageAction } from '@/app/actions/upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const META_MAX = 160;

export function WebDetailsForm({ settings }: { settings: SiteSettings }) {
  const [siteTitle, setSiteTitle] = useState(settings.site_title);
  const [metaDescription, setMetaDescription] = useState(settings.meta_description ?? '');
  const [ogImageUrl, setOgImageUrl] = useState(settings.og_image_url ?? '');
  const [companyName, setCompanyName] = useState(settings.company_name ?? '');
  const [contactEmail, setContactEmail] = useState(settings.contact_email ?? '');
  const [contactPhone, setContactPhone] = useState(settings.contact_phone ?? '');
  const [address, setAddress] = useState(settings.address ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  async function onUploadOg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('file', file);
    const res = await uploadImageAction(fd);
    if ('error' in res) setMsg({ err: res.error });
    else setOgImageUrl(res.url);
    e.target.value = '';
  }

  async function save() {
    if (busy) return;
    setBusy(true); setMsg({});
    const res = await updateSiteSettingsAction({
      site_title: siteTitle.trim(),
      meta_description: metaDescription.trim() || null,
      company_name: companyName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      address: address.trim() || null,
      og_image_url: ogImageUrl.trim() || null,
    });
    setBusy(false);
    setMsg('ok' in res ? { ok: 'Saved.' } : { err: res.error });
  }

  return (
    <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bone)] text-[var(--walnut)]"><Search className="h-5 w-5" /></span>
          <div><h2 className="font-medium text-[var(--ink)]">SEO</h2><p className="text-xs text-[var(--stone)]">How Keppler Commercial Furnishing appears in search results and shared links.</p></div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Site title</Label><Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Meta description</Label>
            <Textarea value={metaDescription} maxLength={META_MAX} rows={3} onChange={(e) => setMetaDescription(e.target.value)} className="resize-none" />
            <p className="text-right text-[11px] text-[var(--stone)]">{metaDescription.length}/{META_MAX}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Social share image</Label>
            {ogImageUrl ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ogImageUrl} alt="" className="h-28 w-52 max-w-none rounded object-cover border border-[var(--line)]" />
                <button type="button" onClick={() => setOgImageUrl('')} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[var(--espresso)] text-xs text-white">x</button>
              </div>
            ) : (
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUploadOg} className="text-sm" />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bone)] text-[var(--walnut)]"><Building2 className="h-5 w-5" /></span>
          <div><h2 className="font-medium text-[var(--ink)]">Company</h2><p className="text-xs text-[var(--stone)]">Business details shown on the site and in contact info.</p></div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Company name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contact email</Label><Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Contact phone</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Address</Label><Textarea value={address} rows={2} onChange={(e) => setAddress(e.target.value)} className="resize-none" /></div>
        </div>
      </section>

      <div className="lg:col-span-2">
        {msg.err && <p className="mb-2 text-sm text-red-600">{msg.err}</p>}
        {msg.ok && <p className="mb-2 text-sm text-[var(--walnut)]">{msg.ok}</p>}
        <Button onClick={save} disabled={busy || !siteTitle.trim()}>{busy ? 'Saving...' : 'Save web details'}</Button>
      </div>
    </div>
  );
}
