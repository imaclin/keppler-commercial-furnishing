import { Sparkline } from '@/components/admin/charts/Sparkline';

export function KpiCard({ label, value, delta, spark, tone = 'default' }: {
  label: string; value: string; delta?: number | null; spark?: number[]; tone?: 'default' | 'warn';
}) {
  return (
    <div className="border border-[var(--line)] bg-[var(--paper)] p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--stone)]">{label}</div>
        {spark && spark.length > 1 && <Sparkline data={spark} />}
      </div>
      <div className={`serif mt-2 text-3xl ${tone === 'warn' ? 'text-[#9a6b3a]' : 'text-[var(--ink)]'}`}>{value}</div>
      {delta !== undefined && delta !== null && (
        <div className={`mt-1 text-xs ${delta >= 0 ? 'text-[#5b7355]' : 'text-red-600'}`}>{delta >= 0 ? '+' : ''}{delta}% vs last month</div>
      )}
    </div>
  );
}
