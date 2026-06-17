'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

/** Chevron back control. Returns to the previous page in history; falls back to
 *  the provided href when there is nothing to go back to. */
export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter();
  function back() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(fallback);
  }
  return (
    <button
      type="button"
      onClick={back}
      aria-label="Go back"
      className="flex items-center gap-1 text-[var(--stone)] transition-colors hover:text-[var(--ink)]"
    >
      <ChevronLeft className="h-5 w-5" />
      <span className="text-xs uppercase tracking-[0.12em]">Back</span>
    </button>
  );
}
