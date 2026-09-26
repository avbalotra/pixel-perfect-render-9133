import { FRESH_PRODUCE_CATEGORIES } from "./data";
import type { AnalysisInput, Commodity, Level, StorageType } from "./types";

export const BASE_INPUT: AnalysisInput = {
  commodity: "",
  category: "Other",
  freshProduce: false,
  moisture: 50,
  oil: 2,
  ph: 6,
  respiration: "Very Low",
  respirationRate: null,
  sensitivities: [],
  productForm: "Whole",
  storageType: "Ambient",
  temperature: 25,
  humidity: 60,
  shelfLifeTarget: 30,
  lightExposure: "Low",
  transportMode: "Road",
  transportHours: 24,
  handling: "Moderate",
  mechanicalRisk: "Medium",
  tempFluctuation: "Low",
  sustainabilityPreference: 3,
  costPreference: 3,
};

const TEMP_BY_STORAGE: Record<StorageType, number> = {
  Ambient: 25,
  Chilled: 4,
  "Cold Storage": 2,
  Frozen: -18,
};

export function inputFromCommodity(
  commodity: Commodity | undefined,
  overrides: Partial<AnalysisInput> = {},
): AnalysisInput {
  const storageType = (overrides.storageType ??
    (commodity?.typical_storage as StorageType) ??
    "Ambient") as StorageType;

  const base: AnalysisInput = {
    ...BASE_INPUT,
    commodity: overrides.commodity ?? commodity?.name ?? "",
    category: commodity?.category ?? overrides.category ?? "Other",
    freshProduce:
      commodity?.fresh_produce ?? FRESH_PRODUCE_CATEGORIES.includes(overrides.category ?? ""),
    moisture: commodity?.default_moisture ?? BASE_INPUT.moisture,
    oil: commodity?.default_oil ?? BASE_INPUT.oil,
    ph: commodity?.default_ph ?? BASE_INPUT.ph,
    respiration: (commodity?.default_respiration as Level) ?? BASE_INPUT.respiration,
    storageType,
    temperature: TEMP_BY_STORAGE[storageType],
    humidity: storageType === "Ambient" ? 60 : 88,
    sensitivities: commodity
      ? [
          ...(commodity.moisture_sensitivity === "High" || commodity.moisture_sensitivity === "Very High"
            ? ["Moisture Sensitive"]
            : []),
          ...((commodity.default_oil ?? 0) >= 8 ? ["Oxidation Sensitive"] : []),
          ...(commodity.perishability === "Very High" || commodity.perishability === "High"
            ? ["Microbial Spoilage Sensitive"]
            : []),
        ]
      : [],
  };

  return { ...base, ...overrides, storageType, temperature: overrides.temperature ?? base.temperature };
}

export const SAMPLE_ROWS: { commodity: string; storage: StorageType; shelfLifeTarget: number }[] = [
  { commodity: "Tomato", storage: "Chilled", shelfLifeTarget: 21 },
  { commodity: "Rice", storage: "Ambient", shelfLifeTarget: 180 },
  { commodity: "Paneer", storage: "Chilled", shelfLifeTarget: 30 },
  { commodity: "Apple", storage: "Cold Storage", shelfLifeTarget: 60 },
];
