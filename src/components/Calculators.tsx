import { Calculator, Wind } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, PrototypeBadge } from "@/components/ui-kit";
import { RESPIRATION_LEVELS } from "@/lib/data";
import type { Level } from "@/lib/types";

const MAP_BASE: Record<Level, { o2: [number, number]; co2: [number, number] }> = {
  "Very Low": { o2: [5, 10], co2: [3, 6] },
  Low: { o2: [3, 6], co2: [4, 8] },
  Moderate: { o2: [3, 5], co2: [3, 8] },
  High: { o2: [2, 5], co2: [5, 10] },
  "Very High": { o2: [1, 3], co2: [10, 15] },
};

/** Indicative MAP gas mix from respiration, temperature and shelf-life target. */
export function computeMap(respiration: Level, temp: number, days: number) {
  const b = MAP_BASE[respiration];
  let [o2lo, o2hi] = b.o2;
  let [co2lo, co2hi] = b.co2;
  if (temp > 10) { o2lo += 1; o2hi += 1; co2lo = Math.max(0, co2lo - 1); co2hi = Math.max(1, co2hi - 2); }
  if (temp <= 2) { co2hi += 1; }
  if (days > 21) { co2lo += 1; co2hi += 2; }
  co2hi = Math.min(co2hi, 20);
  const n2lo = Math.max(0, 100 - o2hi - co2hi);
  const n2hi = 100 - o2lo - co2lo;
  return { o2: `${o2lo}–${o2hi}%`, co2: `${co2lo}–${co2hi}%`, n2: `${n2lo}–${n2hi}%` };
}

function NumInput({ id, label, value, onChange, step = 1, min = 0 }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number; min?: number }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} type="number" min={min} step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))} />
    </div>
  );
}

export function MapCalculator({ commodity, respiration, temperature, shelfLife }: { commodity: string; respiration: Level; temperature: number; shelfLife: number }) {
  const [resp, setResp] = useState<Level>(respiration);
  const [temp, setTemp] = useState(temperature);
  const [days, setDays] = useState(shelfLife);
  const valid = Number.isFinite(temp) && temp >= -5 && temp <= 40 && Number.isFinite(days) && days > 0;
  const out = valid ? computeMap(resp, temp, days) : null;
  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold"><Wind className="size-4 text-primary" /> MAP calculator</h3>
        <PrototypeBadge label="Illustrative Prototype Recommendation" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Commodity: {commodity}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="map-resp" className="text-xs">Respiration rate</Label>
          <select id="map-resp" value={resp} onChange={(e) => setResp(e.target.value as Level)} className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm">
            {RESPIRATION_LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <NumInput id="map-temp" label="Storage temp (°C)" value={temp} onChange={setTemp} min={-5} />
        <NumInput id="map-days" label="Shelf-life target (days)" value={days} onChange={setDays} min={1} />
      </div>
      {out ? (
        <div className="mt-4 grid grid-cols-3 gap-3 text-center" aria-live="polite">
          {[["O₂", out.o2], ["CO₂", out.co2], ["N₂", out.n2]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-secondary/60 p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold tabular-nums">{v}</p></div>
          ))}
        </div>
      ) : (
        <p role="alert" className="mt-4 text-sm text-destructive">Enter a temperature between −5°C and 40°C and a shelf life greater than 0 days.</p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Actual MAP gas composition must be validated experimentally for the specific commodity, package geometry, film permeability, and storage conditions.</p>
    </GlassCard>
  );
}

const money = (n: number) => (Number.isFinite(n) ? n.toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: n < 10 ? 3 : 0 }) : "—");

export function CostCalculator({ materialName, thicknessRange }: { materialName: string; thicknessRange?: string }) {
  const defaultThk = Number((thicknessRange ?? "").match(/\d+/)?.[0] ?? 50);
  const [costKg, setCostKg] = useState(220);
  const [thk, setThk] = useState(defaultThk);
  const [len, setLen] = useState(25);
  const [wid, setWid] = useState(18);
  const [density, setDensity] = useState(0.93);
  const [productKg, setProductKg] = useState(1);
  const [qty, setQty] = useState(10000);

  const r = useMemo(() => {
    const areaCm2 = 2 * len * wid; // two-sided pouch
    const grams = areaCm2 * thk * 1e-4 * density;
    const perPkg = (grams / 1000) * costKg;
    return { grams, perPkg, total: perPkg * qty, perKgProduct: productKg > 0 ? perPkg / productKg : NaN };
  }, [costKg, thk, len, wid, density, qty, productKg]);
  const valid = [costKg, thk, len, wid, density, qty].every((v) => Number.isFinite(v) && v > 0);

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold"><Calculator className="size-4 text-primary" /> Cost calculator</h3>
        <PrototypeBadge label="Estimated Prototype Cost" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Material: {materialName}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumInput id="c-cost" label="Material cost (₹/kg)" value={costKg} onChange={setCostKg} />
        <NumInput id="c-thk" label="Film thickness (µm)" value={thk} onChange={setThk} />
        <NumInput id="c-len" label="Length (cm)" value={len} onChange={setLen} step={0.5} />
        <NumInput id="c-wid" label="Width (cm)" value={wid} onChange={setWid} step={0.5} />
        <NumInput id="c-den" label="Density (g/cm³)" value={density} onChange={setDensity} step={0.01} />
        <NumInput id="c-pw" label="Package content (kg)" value={productKg} onChange={setProductKg} step={0.1} />
        <NumInput id="c-qty" label="Number of packages" value={qty} onChange={setQty} step={100} />
      </div>
      {valid ? (
        <dl className="mt-5 grid gap-3 sm:grid-cols-3" aria-live="polite">
          {[["Per package", money(r.perPkg)], ["Per kg of product", money(r.perKgProduct)], [`Total for ${qty.toLocaleString()}`, money(r.total)]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-secondary/60 p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>
          ))}
        </dl>
      ) : (
        <p role="alert" className="mt-4 text-sm text-destructive">All cost inputs must be greater than 0.</p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">Film mass ≈ {valid ? r.grams.toFixed(2) : "—"} g per two-sided pouch. Material cost only; excludes printing, conversion, labour and freight.</p>
    </GlassCard>
  );
}
