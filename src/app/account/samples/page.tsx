import { getProfile } from '@/lib/auth';
import { listSampleRequests } from '@/lib/account';

export default async function SamplesPage() {
  const profile = await getProfile();
  const samples = profile ? await listSampleRequests(profile.id) : [];
  return (
    <main className="p-10">
      <h1 className="serif text-3xl text-[var(--ink)]">Wood Samples</h1>
      {samples.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--stone)]">No sample requests yet. Order a wood and finish sample from any product page.</p>
      ) : (
        <ul className="mt-8 max-w-2xl divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {samples.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-4 text-sm">
              <div>
                <div className="text-[var(--ink)]">{[s.wood_name, s.finish_name].filter(Boolean).join(' . ') || 'Sample'}</div>
                {s.product_name && <div className="text-xs text-[var(--stone)]">For {s.product_name}</div>}
              </div>
              <span className="rounded-full bg-[var(--bone)] px-3 py-1 text-xs capitalize text-[var(--walnut)]">{s.status}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
