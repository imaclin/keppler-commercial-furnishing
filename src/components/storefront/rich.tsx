import Link from 'next/link';

/* Reusable editorial sections for the brand/story pages. Server components,
   mobile-first. Images use the existing /brand and /demo assets. */

export function RichHero({ image, eyebrow, title, subtitle }: { image: string; eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <section className="relative h-[440px] overflow-hidden md:h-[600px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="h-full w-full object-cover" style={{ filter: 'saturate(0.96) brightness(0.95)' }} />
      <div className="absolute inset-0 flex items-end" style={{ background: 'linear-gradient(180deg, rgba(30,24,18,0.15) 0%, rgba(30,24,18,0) 35%, rgba(30,24,18,0.65) 100%)' }}>
        <div className="mx-auto w-full max-w-[1100px] px-6 pb-12 md:px-10 md:pb-16">
          {eyebrow && <div className="eyebrow" style={{ color: 'rgba(255,253,250,0.85)' }}>{eyebrow}</div>}
          <h1 className="serif mt-3 max-w-[680px] text-[38px] font-medium leading-[1.05] md:text-[64px]" style={{ color: '#fffdfa' }}>{title}</h1>
          {subtitle && <p className="mt-4 max-w-[520px] text-[15px] leading-[1.7] font-light md:text-base" style={{ color: 'rgba(255,253,250,0.9)' }}>{subtitle}</p>}
        </div>
      </div>
    </section>
  );
}

export function Statement({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-6 py-16 text-center md:py-24">
      <div className="mx-auto h-[1.5px] w-[44px] bg-[var(--walnut)]" />
      <h2 className="serif mx-auto mt-7 max-w-[760px] text-[24px] font-normal leading-[1.4] text-[var(--ink)] md:text-[34px]">{children}</h2>
    </section>
  );
}

export function FeatureRow({ image, imageRight, eyebrow, title, body }: { image: string; imageRight?: boolean; eyebrow?: string; title: string; body: string }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2" style={{ alignItems: 'stretch' }}>
      <div className={`h-[300px] overflow-hidden md:h-[520px] ${imageRight ? 'md:order-2' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-full w-full object-cover" />
      </div>
      <div className={`flex flex-col justify-center bg-[var(--bone)] px-6 py-12 md:px-16 md:py-20 ${imageRight ? 'md:order-1' : ''}`}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="serif mt-4 text-[28px] font-normal leading-[1.15] text-[var(--ink)] md:text-[40px]">{title}</h2>
        <p className="mt-5 max-w-[460px] text-[15px] leading-[1.85] font-light text-[var(--ink)]">{body}</p>
      </div>
    </section>
  );
}

export function StatBand({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--paper)] px-6 py-14 md:py-20">
      <div className="mx-auto grid max-w-[1000px] grid-cols-2 gap-y-10 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="serif text-[34px] text-[var(--ink)] md:text-[44px]">{s.value}</div>
            <div className="mt-1 px-2 text-[11px] uppercase tracking-[0.16em] text-[var(--stone)]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Quote({ text, attribution }: { text: string; attribution: string }) {
  return (
    <section className="px-6 py-20 text-center md:py-28">
      <blockquote className="serif mx-auto max-w-[820px] text-[26px] font-normal leading-[1.4] text-[var(--ink)] md:text-[38px]">
        &ldquo;{text}&rdquo;
      </blockquote>
      <div className="mt-6 text-[11px] uppercase tracking-[0.2em] text-[var(--stone)]">{attribution}</div>
    </section>
  );
}

export function CtaBand({ title, body, primary, secondary }: { title: string; body: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return (
    <section className="bg-[var(--espresso)] px-6 py-20 text-center md:py-24">
      <h2 className="serif text-[30px] font-medium leading-[1.15] md:text-[44px]" style={{ color: '#fffdfa' }}>{title}</h2>
      <p className="mx-auto mt-4 max-w-[480px] text-[15px] leading-[1.7]" style={{ color: 'rgba(255,253,250,0.85)' }}>{body}</p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
        <Link href={primary.href} className="inline-block bg-[#fffdfa] px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-medium text-[var(--espresso)]">{primary.label}</Link>
        {secondary && <Link href={secondary.href} className="inline-block border border-[rgba(255,253,250,0.6)] px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-medium text-[#fffdfa]">{secondary.label}</Link>}
      </div>
    </section>
  );
}
