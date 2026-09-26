import { supabase } from "@/integrations/supabase/client";
import type { AnalysisInput, AnalysisResult, StoredAnalysis } from "./types";

const LOCAL_KEY = "packwise.analyses";

function readLocal(): StoredAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as StoredAnalysis[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(list: StoredAnalysis[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 60)));
}

/** Saves an analysis to the database when signed in, otherwise to this browser. */
export async function saveAnalysis(
  input: AnalysisInput,
  result: AnalysisResult,
  userId: string | null,
): Promise<StoredAnalysis> {
  if (!userId) {
    const entry: StoredAnalysis = {
      id: `local-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      input,
      result,
      local: true,
    };
    writeLocal([entry, ...readLocal()]);
    return entry;
  }

  const { data: analysis, error } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      commodity_name: input.commodity,
      commodity_category: input.category,
      storage_type: input.storageType,
      inputs: input as unknown as Record<string, unknown>,
    })
    .select("id, created_at")
    .single();
  if (error) throw error;

  const { error: recError } = await supabase.from("recommendations").insert({
    analysis_id: analysis.id,
    user_id: userId,
    material_slug: result.materialSlug,
    material_name: result.materialName,
    compatibility: result.compatibility,
    shelf_life_min: result.shelfLife.min,
    shelf_life_max: result.shelfLife.max,
    reasons: result.reasons,
    specifications: result.specifications as unknown as Record<string, unknown>,
    factors: result.factors,
    map_conditions: result.mapConditions as unknown as Record<string, unknown>,
    alternatives: result.alternatives,
  });
  if (recError) throw recError;

  const { error: scoreError } = await supabase.from("analysis_material_scores").insert(
    result.scores.map((s) => ({
      analysis_id: analysis.id,
      user_id: userId,
      material_slug: s.slug,
      material_name: s.name,
      score: s.score,
      breakdown: s.breakdown,
    })),
  );
  if (scoreError) throw scoreError;

  return { id: analysis.id, createdAt: analysis.created_at, input, result };
}

interface DbRow {
  id: string;
  created_at: string;
  inputs: AnalysisInput;
  recommendations: {
    material_slug: string;
    material_name: string;
    compatibility: number;
    shelf_life_min: number;
    shelf_life_max: number;
    reasons: string[];
    specifications: AnalysisResult["specifications"];
    factors: AnalysisResult["factors"];
    map_conditions: AnalysisResult["mapConditions"];
    alternatives: AnalysisResult["alternatives"];
  }[];
}

function hydrate(row: DbRow): StoredAnalysis {
  const rec = row.recommendations?.[0];
  const input = row.inputs;
  const result: AnalysisResult = rec
    ? {
        materialSlug: rec.material_slug,
        materialName: rec.material_name,
        compatibility: Number(rec.compatibility),
        reasons: rec.reasons ?? [],
        specifications: rec.specifications,
        factors: rec.factors ?? [],
        mapConditions: rec.map_conditions,
        alternatives: rec.alternatives ?? [],
        shelfLife: { min: rec.shelf_life_min, max: rec.shelf_life_max },
        requirements: { oxygen: 0, moisture: 0, light: 0, mechanical: 0, sealability: 0, permeability: 0, transportRisk: 0 },
        scores: [],
        freshProduce: null,
        sustainability: {
          recyclability: 0,
          complexity: 0,
          usage: 0,
          environmental: 0,
          endOfLife: 0,
          overall: 0,
          note: "",
        },
      }
    : ({} as AnalysisResult);
  return { id: row.id, createdAt: row.created_at, input, result };
}

export async function listAnalyses(userId: string | null): Promise<StoredAnalysis[]> {
  const local = readLocal();
  if (!userId) return local;
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, created_at, inputs, recommendations(material_slug, material_name, compatibility, shelf_life_min, shelf_life_max, reasons, specifications, factors, map_conditions, alternatives)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  const remote = ((data ?? []) as unknown as DbRow[]).map(hydrate);
  return [...remote, ...local].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAnalysis(id: string, userId: string | null): Promise<StoredAnalysis | null> {
  if (id.startsWith("local-")) return readLocal().find((a) => a.id === id) ?? null;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, created_at, inputs, recommendations(material_slug, material_name, compatibility, shelf_life_min, shelf_life_max, reasons, specifications, factors, map_conditions, alternatives)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? hydrate(data as unknown as DbRow) : null;
}

export async function deleteAnalysis(id: string, userId: string | null) {
  if (id.startsWith("local-")) {
    writeLocal(readLocal().filter((a) => a.id !== id));
    return;
  }
  if (!userId) return;
  const { error } = await supabase.from("analyses").delete().eq("id", id);
  if (error) throw error;
}

/** Keeps the most recent result in memory/session so results render instantly after analysis. */
export function cacheResult(entry: StoredAnalysis) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`packwise.result.${entry.id}`, JSON.stringify(entry));
}

export function readCachedResult(id: string): StoredAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`packwise.result.${id}`);
    return raw ? (JSON.parse(raw) as StoredAnalysis) : null;
  } catch {
    return null;
  }
}

export function stashDraft(input: AnalysisInput) {
  if (typeof window !== "undefined")
    window.sessionStorage.setItem("packwise.draft", JSON.stringify(input));
}

export function readDraft(): AnalysisInput | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem("packwise.draft");
    return raw ? (JSON.parse(raw) as AnalysisInput) : null;
  } catch {
    return null;
  }
}
