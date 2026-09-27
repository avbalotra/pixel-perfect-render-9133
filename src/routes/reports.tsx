import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, GlassCard, PageShell, SectionHeading } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { downloadReport } from "@/lib/report";
import { listAnalyses } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Packaging Reports — PACKWISE AI" },
      { name: "description", content: "Download shareable packaging recommendation reports." },
      { property: "og:title", content: "Packaging Reports — PACKWISE AI" },
      { property: "og:description", content: "Export packaging recommendations as shareable reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { user, loading } = useAuth();
  const { data = [], isLoading } = useQuery({
    queryKey: ["analyses", user?.id ?? null],
    queryFn: () => listAnalyses(user?.id ?? null),
    enabled: !loading,
  });

  return (
    <PageShell>
      <SectionHeading eyebrow="Reports" title="Recommendation reports" description="Download a printable report for any analysis." />
      <div className="mt-6">
        {isLoading ? (
          <div className="glass h-40 animate-pulse rounded-3xl" />
        ) : data.length === 0 ? (
          <EmptyState icon={<FileText className="size-5" />} title="No reports yet" description="Reports are generated from your analyses." action={<Button asChild><Link to="/new-analysis">New analysis</Link></Button>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((a, i) => (
              <GlassCard key={a.id} hover delay={i * 0.03} className="p-5">
                <FileText className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{a.input?.commodity} packaging report</h3>
                <p className="text-sm text-muted-foreground">{a.result?.materialName} · {a.result?.compatibility}%</p>
                <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => downloadReport(a)}><Download className="size-4" /> Download</Button>
                  <Button size="sm" variant="outline" asChild><Link to="/results/$id" params={{ id: a.id }}>View</Link></Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
