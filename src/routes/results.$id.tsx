import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, FileSearch, FileText, Leaf, Wind } from "lucide-react";
import { Bar, BarChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AiAdvisor } from "@/components/AiAdvisor";
import { CostCalculator, MapCalculator } from "@/components/Calculators";
import { Button } from "@/components/ui/button";
import { Disclaimer, EmptyState, GlassCard, MeterBar, PageShell, PrototypeBadge, ScoreRing, SectionHeading } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { downloadPdfReport } from "@/lib/pdf-report";
import { downloadReport } from "@/lib/report";
import { getAnalysis, readCachedResult } from "@/lib/store";

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Packaging Recommendation — PACKWISE AI" },
      { name: "description", content: "Recommended packaging material, specifications, alternatives and shelf-life estimate." },
      { property: "og:title", content: "Packaging Recommendation — PACKWISE AI" },
      { property: "og:description", content: "Explainable packaging recommendation with specifications and alternatives." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Results,
});

function Results() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["analysis", id, user?.id ?? null],
    queryFn: async () => readCachedResult(id) ?? (await getAnalysis(id, user?.id ?? null)),
    enabled: !loading,
  });

  if (isLoading || loading) return <PageShell><div className="glass h-64 animate-pulse rounded-3xl" /></PageShell>;
  if (!data)
    return (
      <PageShell>
        <EmptyState
          icon={<FileSearch className="size-5" />}
          title="Analysis not found"
          description="This analysis may have been deleted or belongs to another account."
          action={<Button asChild><Link to="/new-analysis">Start new analysis</Link></Button>}
        />
      </PageShell>
    );

  const { input, result } = data;
  const req = result.requirements;
  const radar = req
    ? [
        { k: "Oxygen", v: req.oxygen },
        { k: "Moisture", v: req.moisture },
        { k: "Light", v: req.light },
        { k: "Mechanical", v: req.mechanical },
        { k: "Sealing", v: req.sealability },
        { k: "Breathability", v: req.permeability },
      ]
    : [];
  const scores = (result.scores ?? []).slice(0, 8).map((s) => ({ name: s.name, score: s.score }));
  const spec = result.specifications;

  return (
    <PageShell>
      <SectionHeading
        eyebrow={`${input.commodity} · ${input.storageType} · ${input.temperature}°C`}
        title="Packaging recommendation"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => downloadReport(data)}><Download className="size-4" /> HTML report</Button>
            <Button onClick={() => downloadPdfReport(data)}><FileText className="size-4" /> Download PDF</Button>
          </div>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <GlassCard className="glass-strong flex flex-col items-center p-8 text-center lg:col-span-1">
          <PrototypeBadge />
          <div className="mt-6"><ScoreRing value={result.compatibility} label="Compatibility" /></div>
          <p className="mt-6 text-xs uppercase tracking-wide text-muted-foreground">Recommended material</p>
          <h3 className="mt-1 font-display text-2xl font-semibold">{result.materialName}</h3>
          <p className="mt-4 text-sm text-muted-foreground">Indicative shelf life</p>
          <p className="font-display text-3xl font-semibold text-primary">{result.shelfLife.min}–{result.shelfLife.max} <span className="text-base">days</span></p>
          <p className="mt-1 text-xs text-muted-foreground">Target: {input.shelfLifeTarget} days</p>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2" delay={0.05}>
          <h3 className="font-semibold">Why this material</h3>
          <ul className="mt-4 space-y-3">
            {result.reasons.map((r) => (
              <li key={r} className="flex gap-3 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />{r}</li>
            ))}
          </ul>
          <h3 className="mt-8 font-semibold">Decision factors</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {result.factors.map((f) => <MeterBar key={f.label} label={f.label} value={f.share} />)}
          </div>
        </GlassCard>

        <GlassCard className="p-6" delay={0.1}>
          <h3 className="font-semibold">Technical specifications</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {[["OTR", spec.otr], ["WVTR", spec.wvtr], ["Thickness", spec.thickness], ["Sealability", spec.sealability], ["Mechanical", spec.mechanical], ["MAP", spec.map]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
                <dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>

        {radar.length > 0 && (
          <GlassCard className="p-6" delay={0.15}>
            <h3 className="font-semibold">Protection requirements</h3>
            <div className="mt-2 h-60">
              <ResponsiveContainer>
                <RadarChart data={radar}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="k" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Radar dataKey="v" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {scores.length > 0 && (
          <GlassCard className="p-6" delay={0.2}>
            <h3 className="font-semibold">Material ranking</h3>
            <div className="mt-2 h-60">
              <ResponsiveContainer>
                <BarChart data={scores} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}
      </div>

      <h3 className="mt-12 text-xl font-semibold">Alternatives</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {result.alternatives.map((a, i) => (
          <GlassCard key={a.focus} hover delay={i * 0.06} className="p-5">
            <p className="eyebrow">{a.focus}</p>
            <h4 className="mt-2 font-semibold">{a.name}</h4>
            <p className="mt-1 text-2xl font-semibold text-primary">{a.compatibility}%</p>
            <p className="mt-3 text-xs text-muted-foreground">Cost {a.cost} · Barrier {a.barrier} · Sustainability {a.sustainability}</p>
            <p className="mt-2 text-sm">{a.use}</p>
          </GlassCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {result.mapConditions.applicable && (
          <GlassCard className="p-6">
            <h3 className="flex items-center gap-2 font-semibold"><Wind className="size-4 text-primary" /> Modified atmosphere</h3>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[["O₂", result.mapConditions.o2], ["CO₂", result.mapConditions.co2], ["N₂", result.mapConditions.n2]].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>
              ))}
            </div>
            {result.freshProduce && (
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                <li>O₂: {result.freshProduce.o2Management}</li>
                <li>CO₂: {result.freshProduce.co2Management}</li>
                <li>Humidity: {result.freshProduce.humidityManagement}</li>
                <li>Condensation risk: {result.freshProduce.condensationRisk}</li>
              </ul>
            )}
          </GlassCard>
        )}
        {result.sustainability && (
          <GlassCard className="p-6">
            <h3 className="flex items-center gap-2 font-semibold"><Leaf className="size-4 text-primary" /> Sustainability</h3>
            <div className="mt-4 space-y-3">
              <MeterBar label="Recyclability" value={result.sustainability.recyclability} />
              <MeterBar label="End of life" value={result.sustainability.endOfLife} />
              <MeterBar label="Overall" value={result.sustainability.overall} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{result.sustainability.note}</p>
          </GlassCard>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MapCalculator commodity={input.commodity} respiration={input.respiration} temperature={input.temperature} shelfLife={input.shelfLifeTarget} />
        <CostCalculator materialName={result.materialName} thicknessRange={spec.thickness} />
      </div>

      <div className="mt-6">
        <AiAdvisor
          key={id}
          commodity={input.commodity}
          storage={`${input.storageType} storage at ${input.temperature}°C, ${input.humidity}% RH; target shelf life ${input.shelfLifeTarget} days.`}
          results={[
            `Recommended: ${result.materialName} (${result.compatibility}% compatibility)`,
            `Indicative shelf life: ${result.shelfLife.min}-${result.shelfLife.max} days`,
            `Specs: OTR ${spec.otr}; WVTR ${spec.wvtr}; thickness ${spec.thickness}; MAP ${spec.map}`,
            `Alternatives: ${result.alternatives.map((a) => `${a.name} (${a.compatibility}%)`).join(", ")}`,
            ...result.reasons.slice(0, 4),
          ].join("\n").slice(0, 4000)}
        />
      </div>

      <Disclaimer>Prototype decision-support output. Values are indicative and must be validated with packaging suppliers and laboratory shelf-life testing.</Disclaimer>
    </PageShell>
  );
}
