import { motion } from "motion/react";
import { Apple, BarChart3, Boxes, FlaskConical, ShieldCheck } from "lucide-react";

const STEPS = [
  { icon: Apple, title: "Food Product", detail: "Tomato" },
  { icon: FlaskConical, title: "Food Properties", detail: "94% moisture · pH 4.2" },
  { icon: BarChart3, title: "Intelligent Analysis", detail: "Barrier requirements" },
  { icon: Boxes, title: "Packaging Recommendation", detail: "Micro-perforated film" },
  { icon: ShieldCheck, title: "Protection + Shelf Life", detail: "Indicative 18–24 days" },
];

export function HeroFlow() {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-5 sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary-soft blur-3xl"
      />
      <p className="eyebrow relative">Analysis pipeline</p>
      <ol className="relative mt-5 space-y-2.5">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.16, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 px-3.5 py-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <step.icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{step.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{step.detail}</span>
              </span>
            </motion.div>
            {index < STEPS.length - 1 ? (
              <div className="ml-[2.05rem] h-4 w-px overflow-hidden bg-border" aria-hidden>
                <motion.div
                  className="h-full w-px bg-primary"
                  initial={{ scaleY: 0, originY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.32 + index * 0.16, duration: 0.35 }}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="relative mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Illustrative prototype pipeline. Outputs are decision-support estimates, not validated laboratory results.
      </p>
    </div>
  );
}
