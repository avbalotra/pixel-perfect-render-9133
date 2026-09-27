import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CountUp, GlassCard } from "@/components/ui-kit";
import { materialsQuery } from "@/lib/data";
import type { StoredAnalysis } from "@/lib/types";

export function DashboardStats({ analyses, signedIn }: { analyses: StoredAnalysis[]; signedIn: boolean }) {
  const { data: materials = [] } = useQuery(materialsQuery);
  const scored = analyses.filter((a) => typeof a.result?.compatibility === "number");
  const avg = scored.length ? Math.round(scored.reduce((s, a) => s + a.result.compatibility, 0) / scored.length) : null;
  const counts = new Map<string, number>();
  analyses.forEach((a) => a.input?.commodity && counts.set(a.input.commodity, (counts.get(a.input.commodity) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // last 14 days activity
  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key.slice(5), count: analyses.filter((a) => a.createdAt.slice(0, 10) === key).length });
  }

  const kpis = [
    { label: "Total analyses", value: analyses.length },
    { label: "Materials available", value: materials.length },
    { label: "Avg. compatibility", value: avg, suffix: "%" },
    { label: "Commodities analysed", value: counts.size },
  ];

  return (
    <>
      <section className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <GlassCard key={k.label} hover delay={i * 0.06} className="p-5">
            <p className="font-display text-3xl font-semibold tabular-nums">
              {k.value === null || (k.value === 0 && k.label !== "Materials available") ? (
                <span className="text-lg text-muted-foreground">No data yet</span>
              ) : (
                <CountUp value={k.value} suffix={k.suffix} />
              )}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{k.label}</p>
          </GlassCard>
        ))}
      </section>
      <p className="mt-3 text-xs text-muted-foreground">
        {signedIn ? "Calculated from analyses saved to your account." : "Calculated from analyses saved in this browser. Sign in to sync them."}
      </p>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="font-semibold">Analysis activity</h3>
          <p className="text-xs text-muted-foreground">Analyses per day, last 14 days</p>
          {analyses.length ? (
            <div className="mt-4 h-52">
              <ResponsiveContainer>
                <AreaChart data={days} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Analyses" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.18} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-10 text-center text-sm text-muted-foreground">No data yet</p>
          )}
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="font-semibold">Most analysed commodities</h3>
          {top.length ? (
            <ul className="mt-4 space-y-3">
              {top.map(([name, n]) => (
                <li key={name} className="text-sm">
                  <div className="flex justify-between"><span>{name}</span><span className="tabular-nums text-muted-foreground">{n}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(n / top[0]![1]) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-10 text-center text-sm text-muted-foreground">No data yet</p>
          )}
        </GlassCard>
      </section>
    </>
  );
}
