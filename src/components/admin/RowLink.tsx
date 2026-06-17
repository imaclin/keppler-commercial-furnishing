'use client';

import { useRouter } from 'next/navigation';

/** A table row that navigates to `href` when clicked. Clicks originating from
 *  interactive children (links, buttons, selects, inputs) are ignored so inline
 *  controls keep working. */
export function RowLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter();

  function navigate(target: EventTarget | null) {
    if (target instanceof HTMLElement && target.closest('a,button,select,input,textarea,label')) return;
    router.push(href);
  }

  return (
    <tr
      onClick={(e) => navigate(e.target)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(href); }}
      tabIndex={0}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </tr>
  );
}
