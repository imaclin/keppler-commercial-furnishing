import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export type Section = { heading: string; body: string | string[] };

// Shared, mobile-friendly template for the static/info pages (footer + nav).
export function ContentPage({
  eyebrow, title, intro, sections, children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  sections?: Section[];
  children?: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[760px] px-6 py-14 md:px-8 md:py-24">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="serif mt-3 text-[34px] leading-[1.1] text-[var(--ink)] md:text-[52px]">{title}</h1>
        {intro && <p className="mt-5 text-[15px] leading-[1.85] text-[var(--stone)] md:text-base">{intro}</p>}

        {sections?.map((s) => (
          <section key={s.heading} className="mt-10">
            <h2 className="serif text-[22px] text-[var(--ink)] md:text-[26px]">{s.heading}</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-[1.85] text-[var(--ink)]">
              {(Array.isArray(s.body) ? s.body : [s.body]).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        ))}

        {children}
      </main>
      <Footer />
    </>
  );
}
