import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { GlassCard, PageShell, SectionHeading, Stars } from "@/components/ui-kit";
import { materialsQuery } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/materials")({
  head: () => ({
    meta: [
      { title: "Packaging Materials Library — PACKWISE AI" },
      { name: "description", content: "Browse and compare food packaging materials by barrier, strength and sustainability." },
      { property: "og:title", content: "Packaging Materials Library — PACKWISE AI" },
      { property: "og:description", content: "Compare oxygen, moisture and light barriers of common food packaging materials." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Materials,
});

function Materials() {
  const { data = [], isLoading } = useQuery(materialsQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [picked, setPicked] = useState<string[]>([]);
  const cats = ["All", ...Array.from(new Set(data.map((m) => m.category)))];
  const list = useMemo(
    () => data.filter((m) => (cat === "All" || m.category === cat) && m.name.toLowerCase().includes(q.toLowerCase())),
    [data, q, cat],
  );
  const compare = data.filter((m) => picked.includes(m.slug));
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : p.length < 3 ? [...p, s] : p));

  return (
    <PageShell>
      <SectionHeading eyebrow="Materials" title="Packaging materials library" description="Reference properties for common food packaging materials. Select up to three to compare." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search materials" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-3 py-1.5 text-sm", cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60")}>
            {c}
          </button>
        ))}
      </div>

      {compare.length > 1 && (
        <GlassCard className="glass-strong mt-6 overflow-x-auto p-6">
          <h3 className="font-semibold">Comparison</h3>
          <table className="mt-4 w-full min-w-[520px] text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-2">Property</th>{compare.map((m) => <th key={m.slug}>{m.name}</th>)}</tr></thead>
            <tbody>
              {([["Oxygen barrier", "oxygen_barrier"], ["Moisture barrier", "moisture_barrier"], ["Light barrier", "light_barrier"], ["Strength", "mechanical_strength"], ["Sealability", "sealability"], ["Sustainability", "sustainability"]] as const).map(([l, k]) => (
                <tr key={k} className="border-t border-border/50"><td className="py-2">{l}</td>{compare.map((m) => <td key={m.slug}><Stars value={m[k]} /></td>)}</tr>
              ))}
              <tr className="border-t border-border/50"><td className="py-2">OTR</td>{compare.map((m) => <td key={m.slug}>{m.otr_label}</td>)}</tr>
              <tr className="border-t border-border/50"><td className="py-2">WVTR</td>{compare.map((m) => <td key={m.slug}>{m.wvtr_label}</td>)}</tr>
              <tr className="border-t border-border/50"><td className="py-2">Temperature</td>{compare.map((m) => <td key={m.slug}>{m.temp_min}°C to {m.temp_max}°C</td>)}</tr>
            </tbody>
          </table>
        </GlassCard>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass h-56 animate-pulse rounded-3xl" />)}
        {list.map((m, i) => (
          <GlassCard key={m.slug} hover delay={i * 0.03} className={cn("p-5", picked.includes(m.slug) && "ring-2 ring-primary")}>
            <div className="flex items-start justify-between gap-2">
              <div><p className="eyebrow">{m.category}</p><h3 className="mt-1 font-semibold">{m.name}</h3></div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input type="checkbox" checked={picked.includes(m.slug)} onChange={() => toggle(m.slug)} className="accent-[var(--color-primary)]" /> Compare
              </label>
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-y-1.5 text-xs">
              <span>Oxygen</span><Stars value={m.oxygen_barrier} />
              <span>Moisture</span><Stars value={m.moisture_barrier} />
              <span>Strength</span><Stars value={m.mechanical_strength} />
              <span>Sustainability</span><Stars value={m.sustainability} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{m.recyclability}</p>
          </GlassCard>
        ))}
      </div>
    </PageShell>
  );
}
