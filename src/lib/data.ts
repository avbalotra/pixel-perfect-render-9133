import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Commodity, Material } from "./types";

export const materialsQuery = queryOptions({
  queryKey: ["materials"],
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<Material[]> => {
    const { data, error } = await supabase.from("materials").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Material[];
  },
});

export const commoditiesQuery = queryOptions({
  queryKey: ["commodities"],
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<Commodity[]> => {
    const { data, error } = await supabase.from("commodities").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Commodity[];
  },
});

export const COMMODITY_CATEGORIES = [
  "Fruits",
  "Vegetables",
  "Cereals",
  "Pulses",
  "Dairy",
  "Meat",
  "Seafood",
  "Bakery",
  "Spices",
  "Processed Food",
  "Other",
];

export const SENSITIVITIES = [
  "Moisture Sensitive",
  "Oxygen Sensitive",
  "Light Sensitive",
  "Aroma Sensitive",
  "Oxidation Sensitive",
  "Microbial Spoilage Sensitive",
];

export const PRODUCT_FORMS = ["Whole", "Cut", "Powder", "Liquid", "Semi-solid", "Processed"];
export const TRANSPORT_MODES = ["Road", "Rail", "Air", "Sea", "Local Distribution"];
export const RESPIRATION_LEVELS = ["Very Low", "Low", "Moderate", "High", "Very High"] as const;

export const FRESH_PRODUCE_CATEGORIES = ["Fruits", "Vegetables"];
