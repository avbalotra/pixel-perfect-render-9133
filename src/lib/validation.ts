import type { AnalysisInput, StorageType } from "./types";

export const TEMP_RANGES: Record<StorageType, [number, number]> = {
  Ambient: [10, 40],
  Chilled: [0, 8],
  "Cold Storage": [-2, 15],
  Frozen: [-40, -12],
};

export type FieldErrors = Partial<Record<keyof AnalysisInput, string | undefined>>;

const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/** Validates the fields belonging to one wizard step (or all steps when step is undefined). */
export function validateInput(f: AnalysisInput, step?: number): FieldErrors {
  const e: FieldErrors = {};
  const check = (s: number) => step === undefined || step === s;
  if (check(0)) {
    if (!f.commodity.trim()) e.commodity = "Please enter or select a food commodity.";
    else if (f.commodity.trim().length > 80) e.commodity = "Commodity name must be 80 characters or fewer.";
    if (!f.category) e.category = "Please choose a commodity category.";
  }
  if (check(1)) {
    if (!num(f.moisture) || f.moisture < 0 || f.moisture > 100) e.moisture = "Please enter a valid moisture content between 0 and 100%.";
    if (!num(f.oil) || f.oil < 0 || f.oil > 100) e.oil = "Please enter a valid oil/fat content between 0 and 100%.";
    else if (num(f.moisture) && f.moisture + f.oil > 100) e.oil = "Moisture and oil/fat together cannot exceed 100%.";
    if (!num(f.ph) || f.ph < 0 || f.ph > 14) e.ph = "Please enter a valid pH between 0 and 14.";
  }
  if (check(2)) {
    const [lo, hi] = TEMP_RANGES[f.storageType];
    if (!num(f.temperature) || f.temperature < lo || f.temperature > hi)
      e.temperature = `${f.storageType} storage temperature should be between ${lo}°C and ${hi}°C.`;
    if (!num(f.humidity) || f.humidity < 0 || f.humidity > 100) e.humidity = "Please enter a valid relative humidity between 0 and 100%.";
    if (!num(f.shelfLifeTarget) || f.shelfLifeTarget <= 0) e.shelfLifeTarget = "Required shelf life must be greater than 0 days.";
    else if (f.shelfLifeTarget > 1095) e.shelfLifeTarget = "Required shelf life should be 3 years (1095 days) or less.";
  }
  if (check(3)) {
    if (!num(f.transportHours) || f.transportHours <= 0) e.transportHours = "Transport duration must be greater than 0 hours.";
    else if (f.transportHours > 2000) e.transportHours = "Transport duration should be 2000 hours or less.";
  }
  return e;
}

export const STEP_OF: Partial<Record<keyof AnalysisInput, number>> = {
  commodity: 0, category: 0, moisture: 1, oil: 1, ph: 1, temperature: 2, humidity: 2, shelfLifeTarget: 2, transportHours: 3,
};
