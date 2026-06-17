'use client';

import { useRef, useState } from 'react';
import { Send, Paperclip, X, FileText, Loader2 } from 'lucide-react';
import { uploadFileAction } from '@/app/actions/upload';
import type { Attachment } from '@/lib/types';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function isImage(type: string) {
  return type.startsWith('image/');
}

interface Props {
  onSend: (body: string, attachments: Attachment[]) => Promise<{ ok: true } | { error: string }>;
  accentClass?: string; // send-button colors
  placeholder?: string;
}

export function MessageComposer({ onSend, accentClass = 'bg-[var(--espresso)] hover:bg-[var(--walnut)]', placeholder = 'Write a message...' }: Props) {
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function autosize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set('file', file);
      const res = await uploadFileAction(fd);
      if ('error' in res) setError(res.error);
      else setAttachments((prev) => [...prev, res]);
    }
    setUploading(false);
  }

  async function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) await uploadFiles(e.target.files);
    e.target.value = '';
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }

  async function send() {
    if (busy || uploading) return;
    if (!body.trim() && attachments.length === 0) return;
    setBusy(true);
    setError(null);
    const res = await onSend(body, attachments);
    setBusy(false);
    if ('ok' in res) {
      setBody('');
      setAttachments([]);
      if (taRef.current) taRef.current.style.height = 'auto';
    } else {
      setError(res.error);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`rounded-2xl border bg-[var(--cream)] px-3 py-2 transition-colors focus-within:border-[var(--stone)] ${dragOver ? 'border-[var(--walnut)] bg-[var(--bone)]' : 'border-[var(--line)]'}`}
    >
      {dragOver && <p className="px-1 pb-2 text-xs text-[var(--walnut)]">Drop files to attach</p>}

      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="relative flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-1 pr-6">
              {isImage(a.type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt="" className="h-10 w-10 max-w-none rounded object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded bg-[var(--bone)] text-[var(--walnut)]"><FileText className="h-5 w-5" /></span>
              )}
              <span className="max-w-[120px] truncate text-xs text-[var(--ink)]">{a.name}</span>
              <button type="button" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} className="absolute right-1 top-1 text-[var(--stone)] hover:text-[var(--ink)]">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Attach files"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--stone)] hover:bg-[var(--bone)] hover:text-[var(--ink)] disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-[18px] w-[18px]" />}
        </button>
        <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={onFilePick} />

        <textarea
          ref={taRef}
          value={body}
          onChange={(e) => { setBody(e.target.value); autosize(); }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          className="max-h-40 min-h-[24px] flex-1 resize-none self-center bg-transparent py-1 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--stone)]"
        />

        <button
          type="button"
          onClick={send}
          disabled={busy || uploading || (!body.trim() && attachments.length === 0)}
          aria-label="Send"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#fffdfa] transition-colors disabled:opacity-40 ${accentClass}`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="px-1 pt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
