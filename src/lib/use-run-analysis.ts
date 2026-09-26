import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { materialsQuery } from "./data";
import { runAnalysis } from "./engine";
import { cacheResult, saveAnalysis } from "./store";
import type { AnalysisInput } from "./types";

/** Runs the rule-based engine, persists the analysis and opens the results page. */
export function useRunAnalysis() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  return useCallback(
    async (input: AnalysisInput) => {
      const materials = await queryClient.ensureQueryData(materialsQuery);
      if (!materials.length) {
        toast.error("No packaging materials available", {
          description: "The material library could not be loaded. Please retry.",
        });
        return null;
      }
      const result = runAnalysis(input, materials);
      let entry;
      try {
        entry = await saveAnalysis(input, result, user?.id ?? null);
      } catch (error) {
        console.error(error);
        toast.error("Could not save this analysis", {
          description: "Showing the result without saving it to your history.",
        });
        entry = {
          id: `local-${crypto.randomUUID()}`,
          createdAt: new Date().toISOString(),
          input,
          result,
          local: true,
        };
      }
      cacheResult(entry);
      await queryClient.invalidateQueries({ queryKey: ["analyses"] });
      await navigate({ to: "/results/$id", params: { id: entry.id } });
      return entry;
    },
    [navigate, queryClient, user?.id],
  );
}
