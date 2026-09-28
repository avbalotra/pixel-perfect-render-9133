import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, History as HistoryIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState, GlassCard, PageShell, SectionHeading } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { deleteAnalysis, listAnalyses, stashDraft } from "@/lib/store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis History — PACKWISE AI" },
      { name: "description", content: "Review and revisit your previous packaging analyses." },
      { property: "og:title", content: "Analysis History — PACKWISE AI" },
      { property: "og:description", content: "All your saved packaging recommendations in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

function History() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ["analyses", user?.id ?? null],
    queryFn: () => listAnalyses(user?.id ?? null),
    enabled: !loading,
  });

  const remove = async (id: string) => {
    try {
      await deleteAnalysis(id, user?.id ?? null);
      await qc.invalidateQueries({ queryKey: ["analyses"] });
      toast.success("Analysis deleted");
    } catch {
      toast.error("Could not delete analysis");
    }
  };

  return (
    <PageShell>
      <SectionHeading eyebrow="History" title="Previous analyses" description={user ? "Saved to your account." : "Saved in this browser. Sign in to keep them across devices."} />
      <div className="mt-6">
        {isLoading ? (
          <div className="glass h-40 animate-pulse rounded-3xl" />
        ) : data.length === 0 ? (
          <EmptyState icon={<HistoryIcon className="size-5" />} title="No analyses yet" description="Run your first packaging analysis to see it here." action={<Button asChild><Link to="/new-analysis">New analysis</Link></Button>} />
        ) : (
          <div className="grid gap-3">
            {data.map((a, i) => (
              <GlassCard key={a.id} hover delay={i * 0.03} className="flex items-center justify-between gap-4 p-4">
                <Link to="/results/$id" params={{ id: a.id }} className="flex-1">
                  <p className="font-medium">{a.input?.commodity} <span className="text-sm text-muted-foreground">· {a.input?.storageType}</span></p>
                  <p className="text-sm text-muted-foreground">{a.result?.materialName} · {new Date(a.createdAt).toLocaleDateString()}</p>
                </Link>
                <span className="font-semibold text-primary tabular-nums">{a.result?.compatibility}%</span>
                <Button variant="ghost" size="icon" aria-label="Duplicate analysis" title="Duplicate" onClick={() => { if (a.input) { stashDraft(a.input); void navigate({ to: "/new-analysis" }); } }}><Copy className="size-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Delete analysis" onClick={() => void remove(a.id)}><Trash2 className="size-4" /></Button>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
