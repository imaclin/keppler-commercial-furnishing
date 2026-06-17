import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/storefront/ProductCard';
import { listFeatured } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const featured = await listFeatured(4);
  return (
    <>
      {/* Announcement bar */}
      <div className="bg-[var(--espresso)] py-[9px] text-center text-[11px] uppercase tracking-[0.18em] text-[#efe7da]">
        Complimentary white-glove delivery on every piece &nbsp;&middot;&nbsp; Handcrafted to order in America
      </div>

      <Header />

      <main>
        {/* Hero */}
        <section className="relative h-[520px] overflow-hidden md:h-[760px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/hero.png"
            alt="HW hero"
            className="h-full w-full object-cover"
            style={{ filter: 'saturate(0.96) brightness(0.97)' }}
          />
          <div
            className="absolute inset-0 flex items-center"
            style={{ background: 'linear-gradient(90deg, rgba(30,24,18,0.40) 0%, rgba(30,24,18,0.12) 45%, rgba(30,24,18,0) 75%)' }}
          >
            <div className="mx-auto w-full max-w-[1320px] px-6 md:px-14">
              <div className="eyebrow" style={{ color: 'rgba(255,253,250,0.82)' }}>Handcrafted in America</div>
              <h1
                className="serif mt-5 max-w-[620px] text-[40px] font-medium leading-[1.06] tracking-[0.005em] sm:text-[56px] md:text-[72px] md:leading-[1.04]"
                style={{ color: '#fffdfa' }}
              >
                Built once.<br />Kept for generations.
              </h1>
              <p className="mt-[22px] mb-[34px] max-w-[430px] text-base leading-[1.7] font-light" style={{ color: 'rgba(255,253,250,0.9)' }}>
                Solid-wood tables and chairs, made to order by master craftsmen and finished by hand. No particle board, no shortcuts, no compromise.
              </p>
              <Link
                href="/tables"
                className="inline-block bg-[#fffdfa] px-[34px] py-[16px] text-[12px] uppercase tracking-[0.2em] font-medium text-[var(--espresso)] no-underline"
              >
                Explore the Collection
              </Link>
              <Link
                href="/consultation"
                className="ml-[14px] inline-block border border-[rgba(255,253,250,0.7)] px-[34px] py-[16px] text-[12px] uppercase tracking-[0.2em] font-medium no-underline"
                style={{ color: '#fffdfa' }}
              >
                Book a Consultation
              </Link>
            </div>
          </div>
        </section>

        {/* Intro statement band */}
        <section className="px-6 pb-16 pt-16 text-center md:px-14 md:pb-[84px] md:pt-24">
          <div className="eyebrow">The HW Standard</div>
          <h2 className="serif mx-auto mt-[18px] max-w-[760px] text-[26px] font-normal leading-[1.3] text-[var(--ink)] md:text-[38px]">
            Every piece is cut, joined, and finished by hand from a single intention: to outlast the people who buy it.
          </h2>
          <div className="mx-auto mt-[26px] h-[1.5px] w-[44px] bg-[var(--walnut)]" />
        </section>

        {/* Category split: Tables / Chairs */}
        <section className="grid grid-cols-2 gap-[4px]">
          <Link href="/tables" className="group relative block h-[340px] overflow-hidden md:h-[560px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/demo/demo-table.png"
              alt="Tables"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(30,24,18,0) 45%, rgba(30,24,18,0.5) 100%)' }}
            />
            <div className="absolute bottom-[44px] left-0 right-0 z-10 text-center" style={{ color: '#fffdfa' }}>
              <div className="serif text-[40px] font-medium">Tables</div>
              <div
                className="mt-2 inline-block border-b border-[rgba(255,253,250,0.6)] pb-[3px] text-[11px] uppercase tracking-[0.24em]"
              >
                Shop Tables
              </div>
            </div>
          </Link>
          <Link href="/chairs" className="group relative block h-[340px] overflow-hidden md:h-[560px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/demo/demo-chair.png"
              alt="Chairs"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(30,24,18,0) 45%, rgba(30,24,18,0.5) 100%)' }}
            />
            <div className="absolute bottom-[44px] left-0 right-0 z-10 text-center" style={{ color: '#fffdfa' }}>
              <div className="serif text-[40px] font-medium">Chairs</div>
              <div
                className="mt-2 inline-block border-b border-[rgba(255,253,250,0.6)] pb-[3px] text-[11px] uppercase tracking-[0.24em]"
              >
                Shop Chairs
              </div>
            </div>
          </Link>
        </section>

        {/* Featured Pieces */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-14">
            <div className="mb-10 text-center md:mb-[52px]">
              <div className="eyebrow">New This Season</div>
              <h2 className="serif mt-3 text-[30px] font-normal text-[var(--ink)] md:text-[42px]">Featured Pieces</h2>
            </div>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-[30px]">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="mt-[56px] text-center">
              <Link
                href="/tables"
                className="inline-block border border-[var(--espresso)] px-[34px] py-[16px] text-[12px] uppercase tracking-[0.2em] font-medium text-[var(--espresso)] no-underline"
              >
                View All Pieces
              </Link>
            </div>
          </div>
        </section>

        {/* Craft band */}
        <section className="grid grid-cols-1 md:grid-cols-2" style={{ alignItems: 'stretch' }}>
          <div className="h-[280px] overflow-hidden md:h-[640px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/craft.png" alt="Our craft" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col justify-center bg-[var(--bone)] px-6 py-12 md:px-[92px] md:py-20">
            <div className="eyebrow">Our Craft</div>
            <h2 className="serif mt-5 text-[32px] font-normal leading-[1.15] text-[var(--ink)] md:text-[46px]">
              Made by hands<br />that have done it<br />for generations.
            </h2>
            <p className="mt-6 max-w-[440px] text-[15px] leading-[1.85] font-light text-[var(--ink)]">
              Our pieces are built in small American workshops by craftsmen who learned the trade from their fathers. Mortise-and-tenon joinery, kiln-dried hardwood, and a hand-rubbed finish that deepens with the years. We build the way furniture was meant to be built, and we sign our work.
            </p>
            <Link
              href="/our-craft"
              className="mt-[34px] inline-block self-start bg-[var(--espresso)] px-[34px] py-[16px] text-[12px] uppercase tracking-[0.2em] font-medium text-[#fffdfa] no-underline"
            >
              Meet the Makers
            </Link>
          </div>
        </section>

        {/* Consultation band */}
        <section className="relative h-[480px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/room.png" alt="Consultation" className="h-full w-full object-cover" />
          <div
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
            style={{ background: 'rgba(30,24,18,0.42)' }}
          >
            <div>
              <h2 className="serif text-[34px] font-medium leading-[1.12] max-w-[640px] md:text-[50px]" style={{ color: '#fffdfa' }}>
                Design it with us.
              </h2>
              <p
                className="mx-auto mb-[30px] mt-[18px] max-w-[460px] text-[15px] leading-[1.7]"
                style={{ color: 'rgba(255,253,250,0.9)' }}
              >
                Tell us about your space and how you live. Our team will help you choose the wood, the finish, and the proportions, with a complimentary one-on-one consultation.
              </p>
              <Link
                href="/consultation"
                className="inline-block bg-[#fffdfa] px-[34px] py-[16px] text-[12px] uppercase tracking-[0.2em] font-medium text-[var(--espresso)] no-underline"
              >
                Book a Consultation
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter strip */}
        <section className="border-t border-[var(--line)] bg-[#fffdfa] px-6 py-16 text-center md:px-14 md:py-[84px]">
          <h3 className="serif text-[30px] font-normal text-[var(--ink)]">Join the workshop list</h3>
          <p className="mx-auto mb-[26px] mt-3 text-[13px] tracking-[0.03em] text-[var(--stone)]">
            New collections, the stories behind them, and the occasional look inside the shop.
          </p>
          <form className="mx-auto inline-flex w-full max-w-[420px] border-b border-[var(--ink)]">
            <input
              type="email"
              placeholder="Email address"
              className="flex-1 border-none bg-transparent px-1 py-3 text-[14px] text-[var(--ink)] outline-none"
            />
            <button type="submit" className="border-none bg-transparent py-3 px-[6px] text-[18px] text-[var(--ink)] cursor-pointer">&rarr;</button>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}
