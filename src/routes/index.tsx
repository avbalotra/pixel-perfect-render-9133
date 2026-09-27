import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, FlaskConical, Layers, PlayCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { DashboardStats } from "@/components/DashboardStats";
import { HeroFlow } from "@/components/HeroFlow";
import { Button } from "@/components/ui/button";
import { Disclaimer, GlassCard, PageShell, PrototypeBadge, SectionHeading } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { commoditiesQuery } from "@/lib/data";
import { DEMO_INPUT } from "@/lib/engine";
import { SAMPLE_ROWS, inputFromCommodity } from "@/lib/presets";
import { listAnalyses } from "@/lib/store";
import { useRunAnalysis } from "@/lib/use-run-analysis";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PACKWISE AI — Intelligent Food Packaging Recommendations" },
      {
        name: "description",
        content:
          "Analyse a food product and get prototype packaging material recommendations optimised for protection, shelf life, cost and sustainability.",
      },
      { property: "og:title", content: "PACKWISE AI — Intelligent Food Packaging Recommendations" },
      {
        property: "og:description",
        content:
          "Analyse a food product and get prototype packaging material recommendations optimised for protection, shelf life, cost and sustainability.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});


function Dashboard() {
  const { user } = useAuth();
  const run = useRunAnalysis();
  const [busy, setBusy] = useState<string | null>(null);
  const { data: commodities = [] } = useQuery(commoditiesQuery);
  const { data: analyses = [] } = useQuery({
    queryKey: ["analyses", user?.id ?? "guest"],
    queryFn: () => listAnalyses(user?.id ?? null),
  });

  const runDemo = async () => {
    setBusy("demo");
    await run(DEMO_INPUT);
    setBusy(null);
  };

  const runSample = async (name: string, storage: string, shelfLifeTarget: number) => {
    setBusy(name);
    const commodity = commodities.find((c) => c.name === name);
    await run(
      inputFromCommodity(commodity, {
        commodity: name,
        storageType: storage as never,
        shelfLifeTarget,
      }),
    );
    setBusy(null);
  };

  const recent = analyses.slice(0, 5);

  return (
    <PageShell>
      <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <PrototypeBadge label="Prototype Decision Support" />
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
            <span className="text-gradient-brand">Intelligent Packaging</span>
            <br />
            for Better Food Protection
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Analyze your food product and discover packaging materials optimized for protection, shelf life, cost, and
            sustainability.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/new-analysis">
                Start Packaging Analysis <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl bg-card/60">
              <Link to="/materials">
                <Layers className="size-4" /> Explore Materials
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-xl"
              onClick={() => void runDemo()}
              disabled={busy !== null}
            >
              <PlayCircle className="size-4" /> {busy === "demo" ? "Running demo…" : "Try Demo"}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Demo runs a chilled tomato scenario end to end: inputs → analysis → recommendation → charts → shelf life.
          </p>
        </div>
        <HeroFlow />
      </section>

      <DashboardStats analyses={analyses} signedIn={!!user} />

      <section className="mt-14">
        <SectionHeading
          eyebrow="Activity"
          title={recent.length ? "Recent analyses" : "Sample analyses"}
          description={
            recent.length
              ? "Open any analysis to review the full recommendation, charts and shelf-life estimate."
              : "Run one of these ready-made scenarios to see a complete prototype recommendation."
          }
          action={
            <Button asChild variant="outline" className="rounded-xl bg-card/60">
              <Link to="/history">View history</Link>
            </Button>
          }
        />

        <GlassCard className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-5 py-3.5 font-semibold">Commodity</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Storage</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Recommended Material</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Compatibility</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.length
                  ? recent.map((a) => (
                      <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/50">
                        <td className="px-5 py-3.5 font-medium">
                          <Link to="/results/$id" params={{ id: a.id }} className="hover:text-primary">
                            {a.input?.commodity ?? "Analysis"}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{a.input?.storageType}</td>
                        <td className="px-5 py-3.5">{a.result?.materialName}</td>
                        <td className="px-5 py-3.5 font-semibold text-primary tabular-nums">
                          {a.result?.compatibility}%
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  : SAMPLE_ROWS.map((row) => (
                      <tr key={row.commodity} className="border-b border-border/50 last:border-0 hover:bg-secondary/50">
                        <td className="px-5 py-3.5 font-medium">{row.commodity}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{row.storage}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">Run to calculate</td>
                        <td className="px-5 py-3.5 text-muted-foreground">—</td>
                        <td className="px-5 py-3.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg"
                            disabled={busy !== null}
                            onClick={() => void runSample(row.commodity, row.storage, row.shelfLifeTarget)}
                          >
                            {busy === row.commodity ? "Analysing…" : "Run analysis"}
                            <ArrowRight className="size-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <Disclaimer>
          PACKWISE AI is a prototype decision-support system. Compatibility scores, shelf-life ranges, MAP gas
          compositions and costs are indicative values that require laboratory and manufacturer validation.
        </Disclaimer>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          {
            icon: FlaskConical,
            title: "Transparent engine",
            body: "A rule-based scoring model evaluates moisture, oxygen, temperature, mechanical and sustainability requirements — and shows its working.",
          },
          {
            icon: Layers,
            title: "Reference material library",
            body: "13 packaging materials with barrier ratings, thickness ranges, cost index and end-of-life profile you can compare side by side.",
          },
          {
            icon: Sparkles,
            title: "Explainable output",
            body: "Every recommendation lists why the material was selected and the weighted factors behind the compatibility score.",
          },
        ].map((card, i) => (
          <GlassCard key={card.title} hover delay={i * 0.07} className="p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <card.icon className="size-5" aria-hidden />
            </span>
            <h3 className="mt-4 text-base font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
          </GlassCard>
        ))}
      </section>
    </PageShell>
  );
}
