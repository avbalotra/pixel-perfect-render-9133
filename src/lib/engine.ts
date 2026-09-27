import type {
  AlternativeCard,
  AnalysisInput,
  AnalysisResult,
  Level,
  Material,
  Requirements,
  ScoredMaterial,
} from "./types";

/**
 * PACKWISE AI prototype recommendation engine.
 *
 * Fully transparent, rule-based scoring. Every requirement is derived from the
 * declared product/storage/transport inputs and every material is scored on the
 * same axes, so the weights below can later be replaced by a trained model
 * without changing the surrounding application.
 *
 * All outputs are prototype decision-support values, not validated laboratory data.
 */

const LEVELS: Level[] = ["Very Low", "Low", "Moderate", "High", "Very High"];

export const levelValue = (level: Level): number => LEVELS.indexOf(level) + 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const WEIGHTS = {
  moisture: 0.24,
  oxygen: 0.22,
  temperature: 0.14,
  mechanical: 0.13,
  shelfLife: 0.1,
  sealability: 0.06,
  light: 0.05,
  cost: 0.03,
  sustainability: 0.03,
};

const FACTOR_LABELS: Record<keyof typeof WEIGHTS, string> = {
  moisture: "Moisture Protection",
  oxygen: "Oxygen Barrier",
  temperature: "Temperature Compatibility",
  mechanical: "Mechanical Protection",
  shelfLife: "Shelf-Life Target",
  sealability: "Sealability",
  light: "Light Protection",
  cost: "Cost",
  sustainability: "Sustainability",
};

export function deriveRequirements(input: AnalysisInput): Requirements {
  const has = (tag: string) => input.sensitivities.includes(tag);
  const respiration = levelValue(input.respiration);

  // Moisture: dry products need a strong barrier against ingress, high-moisture
  // products need control of loss plus condensation management.
  let moisture = 3;
  if (input.moisture < 10) moisture = 5;
  else if (input.moisture < 20) moisture = 4.5;
  else if (input.moisture < 45) moisture = 3.5;
  else if (input.moisture > 85) moisture = 2.5;
  if (has("Moisture Sensitive")) moisture += 1;
  if (input.humidity >= 85) moisture += 0.5;
  if (input.freshProduce && respiration >= 4) moisture -= 1;

  // Oxygen: driven by fat oxidation, declared sensitivity and shelf-life ambition.
  let oxygen = 2.5;
  if (input.oil >= 20) oxygen += 1.5;
  else if (input.oil >= 8) oxygen += 1;
  if (has("Oxygen Sensitive")) oxygen += 1.2;
  if (has("Oxidation Sensitive")) oxygen += 1;
  if (has("Aroma Sensitive")) oxygen += 0.5;
  if (input.shelfLifeTarget > 90) oxygen += 1;
  else if (input.shelfLifeTarget > 30) oxygen += 0.5;
  if (input.ph > 4.6 && has("Microbial Spoilage Sensitive")) oxygen += 0.5;
  if (input.freshProduce && respiration >= 4) oxygen -= 2;

  // Light
  let light = 1.5;
  if (has("Light Sensitive")) light += 2.5;
  if (input.oil >= 15) light += 1;
  if (input.lightExposure === "High") light += 1;
  else if (input.lightExposure === "Medium") light += 0.5;

  // Mechanical + transport risk
  const transportRisk =
    ({ Low: 1, Medium: 2.5, High: 4 }[input.mechanicalRisk] +
      { Low: 0.5, Moderate: 1.5, High: 2.5 }[input.handling] +
      (input.transportHours > 72 ? 1.5 : input.transportHours > 24 ? 1 : 0.3) +
      ({ Air: 1, Sea: 1.2, Rail: 0.8, Road: 0.6, "Local Distribution": 0.2 }[input.transportMode] ?? 0.6)) /
    2;
  let mechanical = clamp(transportRisk, 1, 5);
  if (input.productForm === "Liquid" || input.productForm === "Semi-solid") mechanical += 0.5;

  // Sealability
  let sealability = 3;
  if (["Liquid", "Semi-solid", "Powder"].includes(input.productForm)) sealability = 5;
  if (input.shelfLifeTarget > 60) sealability += 0.5;
  if (input.storageType === "Frozen") sealability += 0.5;

  // Permeability need (fresh produce gas exchange)
  const permeability = input.freshProduce ? clamp(respiration, 1, 5) : 1;

  return {
    moisture: clamp(moisture, 1, 5),
    oxygen: clamp(oxygen, 1, 5),
    light: clamp(light, 1, 5),
    mechanical: clamp(mechanical, 1, 5),
    sealability: clamp(sealability, 1, 5),
    permeability,
    transportRisk: clamp(transportRisk, 1, 5),
  };
}

/** 1 when the material meets or exceeds the need, degrading as it falls short. */
const meets = (have: number, need: number) => clamp(1 - Math.max(0, need - have) / 4, 0, 1);

function temperatureScore(material: Material, input: AnalysisInput) {
  const margin = input.tempFluctuation === "High" ? 8 : input.tempFluctuation === "Moderate" ? 4 : 2;
  const low = input.temperature - margin;
  const high = input.temperature + margin;
  if (low >= material.temp_min && high <= material.temp_max) return 1;
  if (input.temperature >= material.temp_min && input.temperature <= material.temp_max) return 0.75;
  return 0.25;
}

function permeabilityScore(material: Material, req: Requirements, input: AnalysisInput) {
  if (!input.freshProduce || req.permeability < 3) return null;
  // Respiring produce needs gas exchange: high OTR films score best.
  const otr = material.otr_value;
  if (otr >= 10000) return 1;
  if (otr >= 2000) return 0.82;
  if (otr >= 500) return 0.55;
  return 0.2;
}

export function scoreMaterial(material: Material, input: AnalysisInput, req: Requirements): ScoredMaterial {
  const permeability = permeabilityScore(material, req, input);
  const breakdown: Record<string, number> = {
    moisture: meets(material.moisture_barrier, req.moisture),
    oxygen: permeability ?? meets(material.oxygen_barrier, req.oxygen),
    temperature: temperatureScore(material, input),
    mechanical: meets(material.mechanical_strength, req.mechanical),
    shelfLife: clamp(
      0.45 +
        0.11 *
          ((material.oxygen_barrier + material.moisture_barrier) / 2) *
          (input.shelfLifeTarget > 45 ? 1.1 : 0.95),
      0,
      1,
    ),
    sealability: meets(material.sealability, req.sealability),
    light: meets(material.light_barrier, req.light),
    cost: clamp(1 - (material.relative_cost - 1) / 4, 0, 1) * (0.55 + 0.09 * input.costPreference),
    sustainability: (material.sustainability / 5) * (0.55 + 0.09 * input.sustainabilityPreference),
  };

  if (input.freshProduce && req.permeability >= 4 && !material.fresh_produce_suitable) {
    breakdown['moisture'] = (breakdown['moisture'] ?? 0) * 0.8;
  }
  if (input.storageType === "Frozen" && material.temp_min > -18) {
    breakdown['temperature'] = Math.min(breakdown['temperature'] ?? 0, 0.3);
  }

  const raw = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
    (sum, key) => sum + WEIGHTS[key] * (breakdown[key] ?? 0),
    0,
  );

  return { material, score: clamp(Math.round(raw * 100), 12, 97), breakdown };
}

function buildFactors(best: ScoredMaterial) {
  const keys = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).filter((k) => WEIGHTS[k] >= 0.05);
  const contributions = keys.map((key) => ({
    label: FACTOR_LABELS[key],
    value: WEIGHTS[key] * (best.breakdown[key] ?? 0),
  }));
  const total = contributions.reduce((s, c) => s + c.value, 0) || 1;
  const shares = contributions.map((c) => ({ label: c.label, share: Math.round((c.value / total) * 100) }));
  const drift = 100 - shares.reduce((s, c) => s + c.share, 0);
  if (shares[0]) shares[0].share += drift;
  return shares.sort((a, b) => b.share - a.share);
}

function buildReasons(m: Material, req: Requirements, input: AnalysisInput): string[] {
  const reasons: string[] = [];
  if (input.freshProduce && req.permeability >= 4 && m.otr_value >= 2000)
    reasons.push("Permeable structure supports respiration gas exchange for fresh produce");
  if (m.oxygen_barrier >= 4 && req.oxygen >= 3.5) reasons.push("Strong oxygen barrier for an oxidation-sensitive product");
  if (m.moisture_barrier >= 4 && req.moisture >= 3.5) reasons.push("Good moisture protection at the declared humidity");
  if (m.light_barrier >= 4 && req.light >= 3) reasons.push("High light barrier protects light-sensitive constituents");
  if (m.temp_min <= input.temperature && m.temp_max >= input.temperature)
    reasons.push(`Suitable for ${input.storageType.toLowerCase()} storage at ${input.temperature} °C`);
  if (m.sealability >= 4) reasons.push("Good sealability for reliable pack integrity");
  if (m.mechanical_strength >= 4 && req.mechanical >= 3)
    reasons.push("Mechanical strength suits the declared handling and transport risk");
  if (input.shelfLifeTarget > 30 && (m.oxygen_barrier + m.moisture_barrier) / 2 >= 4)
    reasons.push("Suitable for extended shelf-life applications");
  if (m.sustainability >= 4) reasons.push(`${m.recyclability} end-of-life profile supports sustainability goals`);
  if (m.relative_cost <= 2) reasons.push("Low relative material cost for high-volume packing");
  return reasons.slice(0, 6);
}

function shelfLife(input: AnalysisInput, best: ScoredMaterial) {
  let base = 120;
  if (input.moisture > 85) base = 7;
  else if (input.moisture > 70) base = 12;
  else if (input.moisture > 45) base = 25;
  else if (input.moisture > 20) base = 60;

  const storage = { Ambient: 1, Chilled: 2.6, "Cold Storage": 3.1, Frozen: 7 }[input.storageType] ?? 1;
  const barrier = 0.7 + 0.5 * (best.score / 100);
  const microbial = input.ph > 4.6 && input.moisture > 60 ? 0.8 : 1;
  const transport = input.tempFluctuation === "High" ? 0.85 : input.tempFluctuation === "Moderate" ? 0.93 : 1;

  const mid = base * storage * barrier * microbial * transport;
  const min = Math.max(2, Math.round(mid * 0.86));
  const max = Math.max(min + 2, Math.round(mid * 1.14));
  return { min, max };
}

function specifications(m: Material, req: Requirements) {
  const band = (v: number) => (v >= 4.2 ? "High" : v >= 3 ? "Medium–High" : v >= 2 ? "Medium" : "Low");
  return {
    otr: req.permeability >= 4 ? "High OTR Target (gas exchange)" : `${m.otr_label} Target`,
    wvtr: `${m.wvtr_label} Target`,
    thickness: m.thickness_range,
    sealability: band(m.sealability),
    mechanical: band(m.mechanical_strength),
    map: m.map_suitable ? "Suitable" : "Not recommended",
  };
}

function alternatives(scored: ScoredMaterial[], bestSlug: string): AlternativeCard[] {
  const pool = scored.filter((s) => s.material.slug !== bestSlug);
  const costLabel = ["Very Low", "Low", "Moderate", "High", "Very High"];
  const pick = (
    focus: AlternativeCard["focus"],
    sorter: (a: ScoredMaterial, b: ScoredMaterial) => number,
    use: string,
  ): AlternativeCard | null => {
    const candidate = [...pool].sort(sorter)[0];
    if (!candidate) return null;
    const m = candidate.material;
    return {
      focus,
      slug: m.slug,
      name: m.name,
      compatibility: candidate.score,
      cost: costLabel[m.relative_cost - 1] ?? "Moderate",
      barrier: `O₂ ${m.oxygen_barrier}/5 · H₂O ${m.moisture_barrier}/5`,
      sustainability: m.recyclability,
      use: use,
    };
  };

  const cards = [
    pick(
      "Cost Focused",
      (a, b) => a.material.relative_cost - b.material.relative_cost || b.score - a.score,
      "High-volume packing where cost per unit dominates",
    ),
    pick(
      "Performance Focused",
      (a, b) =>
        b.material.oxygen_barrier + b.material.moisture_barrier - (a.material.oxygen_barrier + a.material.moisture_barrier) ||
        b.score - a.score,
      "Maximum barrier protection and longest indicative shelf life",
    ),
    pick(
      "Sustainability Focused",
      (a, b) => b.material.sustainability - a.material.sustainability || b.score - a.score,
      "Recyclable or compostable packaging targets",
    ),
  ].filter(Boolean) as AlternativeCard[];

  // De-duplicate while keeping each focus represented.
  const seen = new Set<string>();
  return cards.map((card) => {
    if (!seen.has(card.slug)) {
      seen.add(card.slug);
      return card;
    }
    const replacement = pool.find((s) => !seen.has(s.material.slug) && s.material.slug !== card.slug);
    if (!replacement) return card;
    seen.add(replacement.material.slug);
    return {
      ...card,
      slug: replacement.material.slug,
      name: replacement.material.name,
      compatibility: replacement.score,
      cost: costLabel[replacement.material.relative_cost - 1] ?? "Moderate",
      barrier: `O₂ ${replacement.material.oxygen_barrier}/5 · H₂O ${replacement.material.moisture_barrier}/5`,
      sustainability: replacement.material.recyclability,
    };
  });
}

function mapConditions(input: AnalysisInput, req: Requirements) {
  if (input.freshProduce && req.permeability >= 3)
    return { o2: "3–5%", co2: "5–10%", n2: "Balance", applicable: true };
  if (input.category === "Meat" || input.category === "Seafood")
    return { o2: "0–1%", co2: "30–40%", n2: "Balance", applicable: true };
  if (input.category === "Bakery" || input.category === "Dairy")
    return { o2: "0–1%", co2: "20–30%", n2: "Balance", applicable: true };
  if (input.moisture < 15) return { o2: "0–1%", co2: "0–2%", n2: "Balance", applicable: false };
  return { o2: "2–5%", co2: "5–15%", n2: "Balance", applicable: true };
}

function sustainability(m: Material) {
  const recyclability = m.recyclability === "High" ? 5 : m.recyclability === "Compostable" ? 5 : m.recyclability === "Moderate" ? 3 : 1;
  const complexity = m.category.includes("Multilayer") || m.category.includes("Laminate") ? 2 : 4;
  const usage = clamp(6 - m.relative_cost, 1, 5);
  const environmental = m.sustainability;
  const endOfLife = m.recyclability === "Compostable" ? 5 : recyclability;
  const overall = Math.round(((recyclability + complexity + usage + environmental + endOfLife) / 25) * 100);
  return {
    recyclability,
    complexity,
    usage,
    environmental,
    endOfLife,
    overall,
    note:
      "Indicative prototype sustainability profile based on reference material attributes. Recyclability depends on local collection streams and requires manufacturer validation.",
  };
}

export function runAnalysis(input: AnalysisInput, materials: Material[]): AnalysisResult {
  const req = deriveRequirements(input);
  const scored = materials
    .map((m) => scoreMaterial(m, input, req))
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) throw new Error("No materials to score");
  const m = best.material;

  return {
    materialSlug: m.slug,
    materialName: m.name,
    compatibility: best.score,
    reasons: buildReasons(m, req, input),
    specifications: specifications(m, req),
    factors: buildFactors(best),
    mapConditions: mapConditions(input, req),
    alternatives: alternatives(scored, m.slug),
    shelfLife: shelfLife(input, best),
    requirements: req,
    scores: scored.map((s) => ({
      slug: s.material.slug,
      name: s.material.name,
      score: s.score,
      breakdown: s.breakdown,
    })),
    freshProduce:
      input.freshProduce
        ? {
            respiration: input.respiration,
            o2Management: req.permeability >= 4 ? "Active venting required" : "Moderate venting",
            co2Management: req.permeability >= 4 ? "Continuous CO₂ release" : "Limited CO₂ build-up",
            humidityManagement: input.humidity >= 90 ? "High — anti-fog recommended" : "Moderate",
            condensationRisk: input.humidity >= 88 && input.temperature <= 8 ? "High" : input.humidity >= 75 ? "Moderate" : "Low",
          }
        : null,
    sustainability: sustainability(m),
  };
}

export const DEMO_INPUT: AnalysisInput = {
  commodity: "Tomato",
  category: "Vegetables",
  freshProduce: true,
  moisture: 94,
  oil: 0.2,
  ph: 4.2,
  respiration: "High",
  respirationRate: null,
  sensitivities: ["Moisture Sensitive", "Microbial Spoilage Sensitive"],
  productForm: "Whole",
  storageType: "Chilled",
  temperature: 4,
  humidity: 90,
  shelfLifeTarget: 21,
  lightExposure: "Low",
  transportMode: "Road",
  transportHours: 24,
  handling: "Moderate",
  mechanicalRisk: "Medium",
  tempFluctuation: "Moderate",
  sustainabilityPreference: 3,
  costPreference: 3,
};
