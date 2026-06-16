import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1320px] px-14 py-24 text-center">
        <div className="eyebrow">Handcrafted in America</div>
        <h1 className="serif mx-auto mt-5 max-w-[640px] text-6xl font-medium leading-[1.05] text-[var(--ink)]">
          Built once. Kept for generations.
        </h1>
        <p className="mx-auto mt-6 max-w-[420px] text-[var(--stone)]">
          The storefront, catalog, and portal arrive in the next phases. This is the foundation.
        </p>
      </main>
      <Footer />
    </>
  );
}
