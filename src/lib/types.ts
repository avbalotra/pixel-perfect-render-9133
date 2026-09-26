export type Level = "Very Low" | "Low" | "Moderate" | "High" | "Very High";
export type StorageType = "Ambient" | "Chilled" | "Frozen" | "Cold Storage";

export interface Material {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  oxygen_barrier: number;
  moisture_barrier: number;
  light_barrier: number;
  mechanical_strength: number;
  sealability: number;
  sustainability: number;
  recyclability: string;
  otr_label: string;
  wvtr_label: string;
  otr_value: number;
  wvtr_value: number;
  thickness_range: string;
  temp_min: number;
  temp_max: number;
  relative_cost: number;
  cost_index: number;
  map_suitable: boolean;
  fresh_produce_suitable: boolean;
  data_status: string;
}

export interface Commodity {
  id: string;
  name: string;
  category: string;
  moisture_sensitivity: string;
  perishability: string;
  respiration_category: string;
  typical_storage: string;
  fresh_produce: boolean;
  default_moisture: number | null;
  default_oil: number | null;
  default_ph: number | null;
  default_respiration: Level | null;
}

export interface AnalysisInput {
  commodity: string;
  category: string;
  freshProduce: boolean;
  moisture: number;
  oil: number;
  ph: number;
  respiration: Level;
  respirationRate: number | null;
  sensitivities: string[];
  productForm: string;
  storageType: StorageType;
  temperature: number;
  humidity: number;
  shelfLifeTarget: number;
  lightExposure: "Low" | "Medium" | "High";
  transportMode: string;
  transportHours: number;
  handling: "Low" | "Moderate" | "High";
  mechanicalRisk: "Low" | "Medium" | "High";
  tempFluctuation: "Low" | "Moderate" | "High";
  sustainabilityPreference: number;
  costPreference: number;
}

export interface Requirements {
  oxygen: number;
  moisture: number;
  light: number;
  mechanical: number;
  sealability: number;
  permeability: number;
  transportRisk: number;
}

export interface FactorContribution {
  label: string;
  share: number;
}

export interface ScoredMaterial {
  material: Material;
  score: number;
  breakdown: Record<string, number>;
}

export interface AlternativeCard {
  focus: "Cost Focused" | "Performance Focused" | "Sustainability Focused";
  slug: string;
  name: string;
  compatibility: number;
  cost: string;
  barrier: string;
  sustainability: string;
  use: string;
}

export interface Specifications {
  otr: string;
  wvtr: string;
  thickness: string;
  sealability: string;
  mechanical: string;
  map: string;
}

export interface MapConditions {
  o2: string;
  co2: string;
  n2: string;
  applicable: boolean;
}

export interface AnalysisResult {
  materialSlug: string;
  materialName: string;
  compatibility: number;
  reasons: string[];
  specifications: Specifications;
  factors: FactorContribution[];
  mapConditions: MapConditions;
  alternatives: AlternativeCard[];
  shelfLife: { min: number; max: number };
  requirements: Requirements;
  scores: { slug: string; name: string; score: number; breakdown: Record<string, number> }[];
  freshProduce: {
    respiration: Level;
    o2Management: string;
    co2Management: string;
    humidityManagement: string;
    condensationRisk: string;
  } | null;
  sustainability: {
    recyclability: number;
    complexity: number;
    usage: number;
    environmental: number;
    endOfLife: number;
    overall: number;
    note: string;
  };
}

export interface StoredAnalysis {
  id: string;
  createdAt: string;
  input: AnalysisInput;
  result: AnalysisResult;
  local?: boolean;
}
