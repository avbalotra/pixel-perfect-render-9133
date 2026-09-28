import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, PlayCircle, Sparkles } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disclaimer, GlassCard, PageShell, SectionHeading } from "@/components/ui-kit";
import {
  COMMODITY_CATEGORIES,
  FRESH_PRODUCE_CATEGORIES,
  PRODUCT_FORMS,
  RESPIRATION_LEVELS,
  SENSITIVITIES,
  TRANSPORT_MODES,
  commoditiesQuery,
} from "@/lib/data";
import { DEMO_INPUT } from "@/lib/engine";
import { BASE_INPUT, inputFromCommodity } from "@/lib/presets";
import { readDraft } from "@/lib/store";
import type { AnalysisInput, StorageType } from "@/lib/types";
import { useRunAnalysis } from "@/lib/use-run-analysis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/new-analysis")({
  head: () => ({
    meta: [
      { title: "New Packaging Analysis — PACKWISE AI" },
      { name: "description", content: "Enter food properties, storage and transport conditions to get a packaging recommendation." },
      { property: "og:title", content: "New Packaging Analysis — PACKWISE AI" },
      { property: "og:description", content: "Describe your food product and get an explainable packaging recommendation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewAnalysis,
});

const STEPS = ["Product", "Properties", "Storage", "Transport"];
const PHASES = [
  "Analyzing food properties",
  "Evaluating barrier requirements",
  "Matching materials",
  "Optimizing packaging",
  "Generating recommendation",
];
const STORAGE: StorageType[] = ["Ambient", "Chilled", "Cold Storage", "Frozen"];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function Pills<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
            value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 hover:border-primary/50",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function NumField({ label, value, onChange, step = 1, error, reference }: { label: string; value: number; onChange: (n: number) => void; step?: number; error?: string; reference?: boolean }) {
  return (
    <Field label={label}>
      <Input
        type="number"
        step={step}
        aria-invalid={!!error}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        className={cn(error && "border-destructive")}
      />
      {reference && !error && <p className="text-xs text-muted-foreground">Reference Value from commodity library — edit to override.</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </Field>
  );
}

function NewAnalysis() {
  const { data: commodities = [] } = useQuery(commoditiesQuery);
  const run = useRunAnalysis();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AnalysisInput>(BASE_INPUT);
  const [phase, setPhase] = useState(-1);

  useEffect(() => {
    const d = readDraft();
    if (d) setForm(d);
  }, []);

  const set = <K extends keyof AnalysisInput>(k: K, v: AnalysisInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const pickCommodity = (name: string) => {
    const c = commodities.find((x) => x.name === name);
    setForm(c ? inputFromCommodity(c) : { ...form, commodity: name });
  };

  const analyze = async (input: AnalysisInput) => {
    for (let i = 0; i < PHASES.length; i++) {
      setPhase(i);
      await new Promise((r) => setTimeout(r, 420));
    }
    setPhase(PHASES.length);
    const res = await run(input);
    if (!res) setPhase(-1);
  };

  if (phase >= 0) {
    return (
      <PageShell className="flex min-h-[80vh] items-center justify-center">
        <GlassCard className="glass-strong w-full max-w-md p-8">
          <div className="relative mx-auto mb-8 grid size-24 place-items-center">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-t-2 border-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
            <Sparkles className="size-8 text-primary" />
          </div>
          <p className="mb-5 text-center font-display text-lg font-semibold">Analyzing {form.commodity || "product"}</p>
          <ul className="space-y-3">
            {PHASES.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn("flex items-center gap-3 text-sm", i > phase && "text-muted-foreground")}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border",
                    i < phase && "border-primary bg-primary text-primary-foreground",
                    i === phase && "border-primary",
                  )}
                >
                  {i < phase ? <Check className="size-3" /> : i === phase ? <span className="size-2 animate-pulse rounded-full bg-primary" /> : null}
                </span>
                {p}
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-4xl">
      <SectionHeading
        eyebrow="New analysis"
        title="Describe your food product"
        description="Four short steps. Defaults are filled in from the commodity library and can be adjusted."
        action={
          <Button variant="outline" onClick={() => void analyze(DEMO_INPUT)}>
            <PlayCircle className="size-4" /> Try demo (Tomato)
          </Button>
        }
      />

      <div className="mt-8 flex gap-2">
        {STEPS.map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i)} className="flex-1 text-left">
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <motion.div className="h-full bg-primary" animate={{ width: i <= step ? "100%" : "0%" }} />
            </div>
            <p className={cn("mt-2 text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
              {i + 1}. {s}
            </p>
          </button>
        ))}
      </div>

      <GlassCard className="mt-6 p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {step === 0 && (
              <>
                <Field label="Food commodity">
                  <Input list="commodities" value={form.commodity} placeholder="e.g. Tomato" onChange={(e) => pickCommodity(e.target.value)} />
                  <datalist id="commodities">
                    {commodities.map((c) => <option key={c.id} value={c.name} />)}
                  </datalist>
                </Field>
                <Field label="Category">
                  <select
                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                    value={form.category}
                    onChange={(e) => {
                      set("category", e.target.value);
                      set("freshProduce", FRESH_PRODUCE_CATEGORIES.includes(e.target.value));
                    }}
                  >
                    {COMMODITY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Product form">
                    <Pills options={PRODUCT_FORMS} value={form.productForm} onChange={(v) => set("productForm", v)} />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={form.freshProduce} onChange={(e) => set("freshProduce", e.target.checked)} className="accent-[var(--color-primary)]" />
                  Fresh, respiring produce
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <NumField label="Moisture content (%)" value={form.moisture} onChange={(n) => set("moisture", n)} />
                <NumField label="Oil / fat content (%)" value={form.oil} onChange={(n) => set("oil", n)} />
                <NumField label="pH" step={0.1} value={form.ph} onChange={(n) => set("ph", n)} />
                <div className="sm:col-span-2">
                  <Field label="Respiration rate">
                    <Pills options={RESPIRATION_LEVELS} value={form.respiration} onChange={(v) => set("respiration", v)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Product sensitivity">
                    <div className="flex flex-wrap gap-2">
                      {SENSITIVITIES.map((s) => {
                        const on = form.sensitivities.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => set("sensitivities", on ? form.sensitivities.filter((x) => x !== s) : [...form.sensitivities, s])}
                            className={cn(
                              "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                              on ? "border-primary bg-primary-soft text-foreground" : "border-border bg-card/60",
                            )}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="sm:col-span-2">
                  <Field label="Storage type">
                    <Pills options={STORAGE} value={form.storageType} onChange={(v) => set("storageType", v)} />
                  </Field>
                </div>
                <NumField label="Storage temperature (°C)" value={form.temperature} onChange={(n) => set("temperature", n)} />
                <NumField label="Relative humidity (%)" value={form.humidity} onChange={(n) => set("humidity", n)} />
                <NumField label="Required shelf life (days)" value={form.shelfLifeTarget} onChange={(n) => set("shelfLifeTarget", n)} />
                <Field label="Light exposure">
                  <Pills options={["Low", "Medium", "High"] as const} value={form.lightExposure} onChange={(v) => set("lightExposure", v)} />
                </Field>
              </>
            )}
            {step === 3 && (
              <>
                <div className="sm:col-span-2">
                  <Field label="Transport mode">
                    <Pills options={TRANSPORT_MODES} value={form.transportMode} onChange={(v) => set("transportMode", v)} />
                  </Field>
                </div>
                <NumField label="Transport duration (hours)" value={form.transportHours} onChange={(n) => set("transportHours", n)} />
                <Field label="Mechanical risk">
                  <Pills options={["Low", "Medium", "High"] as const} value={form.mechanicalRisk} onChange={(v) => set("mechanicalRisk", v)} />
                </Field>
                <Field label="Temperature fluctuation">
                  <Pills options={["Low", "Moderate", "High"] as const} value={form.tempFluctuation} onChange={(v) => set("tempFluctuation", v)} />
                </Field>
                <Field label={`Sustainability priority: ${form.sustainabilityPreference}/5`}>
                  <input type="range" min={1} max={5} value={form.sustainabilityPreference} onChange={(e) => set("sustainabilityPreference", Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
                </Field>
                <Field label={`Cost priority: ${form.costPreference}/5`}>
                  <input type="range" min={1} max={5} value={form.costPreference} onChange={(e) => set("costPreference", Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
                </Field>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button disabled={!form.commodity.trim()} onClick={() => void analyze(form)}>
              <Sparkles className="size-4" /> Analyze packaging
            </Button>
          )}
        </div>
      </GlassCard>
      <Disclaimer>Prototype decision-support tool. Recommendations are indicative and require supplier and laboratory validation.</Disclaimer>
    </PageShell>
  );
}
