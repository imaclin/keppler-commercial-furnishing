'use client';

import { useState } from 'react';
import { Download, X, FileText } from 'lucide-react';
import type { Attachment } from '@/lib/types';

function isImage(type: string) {
  return type.startsWith('image/');
}

function formatBytes(n: number): string {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function MessageAttachments({ attachments, onLight }: { attachments: Attachment[]; onLight?: boolean }) {
  const [active, setActive] = useState<Attachment | null>(null);
  if (!attachments || attachments.length === 0) return null;

  const chipBorder = onLight ? 'border-[var(--line)] bg-[var(--paper)]' : 'border-white/25 bg-white/10';
  const chipText = onLight ? 'text-[var(--ink)]' : 'text-[#fffdfa]';
  const chipSub = onLight ? 'text-[var(--stone)]' : 'text-white/70';

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((a, i) =>
          isImage(a.type) ? (
            <button key={i} type="button" onClick={() => setActive(a)} className="block overflow-hidden rounded-lg border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.name} className="h-36 w-36 max-w-none object-cover" />
            </button>
          ) : (
            <button key={i} type="button" onClick={() => setActive(a)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left ${chipBorder}`}>
              <FileText className={`h-5 w-5 shrink-0 ${chipText}`} />
              <span className="min-w-0">
                <span className={`block max-w-[160px] truncate text-xs font-medium ${chipText}`}>{a.name}</span>
                {a.size > 0 && <span className={`block text-[10px] ${chipSub}`}>{formatBytes(a.size)}</span>}
              </span>
            </button>
          ),
        )}
      </div>

      {active && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--ink)]">{active.name}</div>
                {active.size > 0 && <div className="text-xs text-[var(--stone)]">{formatBytes(active.size)}</div>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a href={active.url} download={active.name} className="flex items-center gap-1.5 rounded border border-[var(--line)] px-3 py-1.5 text-xs uppercase tracking-[0.1em] text-[var(--ink)] hover:bg-[var(--bone)]">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                <button onClick={() => setActive(null)} aria-label="Close" className="text-[var(--stone)] hover:text-[var(--ink)]"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--cream)]">
              {isImage(active.type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.url} alt={active.name} className="mx-auto max-h-[78vh] w-auto max-w-full object-contain" />
              ) : active.type === 'application/pdf' ? (
                <iframe src={active.url} title={active.name} className="h-[78vh] w-full" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <FileText className="h-12 w-12 text-[var(--stone)]" />
                  <p className="text-sm text-[var(--stone)]">No inline preview for this file type.</p>
                  <a href={active.url} download={active.name} className="flex items-center gap-1.5 rounded bg-[var(--espresso)] px-4 py-2 text-xs uppercase tracking-[0.1em] text-[#fffdfa]">
                    <Download className="h-3.5 w-3.5" /> Download {active.name}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
