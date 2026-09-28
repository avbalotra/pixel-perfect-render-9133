import { Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard, PrototypeBadge } from "@/components/ui-kit";

function renderMd(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h4 key={i} className="mt-4 font-semibold first:mt-0">{line.slice(3)}</h4>;
    if (/^[-*] /.test(line)) return <li key={i} className="ml-5 list-disc text-sm">{line.slice(2).replace(/\*\*/g, "")}</li>;
    if (!line.trim()) return null;
    return <p key={i} className="text-sm">{line.replace(/\*\*/g, "")}</p>;
  });
}

export function AiAdvisor(props: { commodity: string; storage: string; results: string }) {
  const [commodity, setCommodity] = useState(props.commodity);
  const [storage, setStorage] = useState(props.storage);
  const [results, setResults] = useState(props.results);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  const run = async () => {
    setError(""); setText("");
    if (!commodity.trim() || !storage.trim() || !results.trim()) { setError("Please fill in all three fields."); return; }
    setBusy(true);
    ctrl.current = new AbortController();
    try {
      const res = await fetch("/api/ai-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commodity, storage, results }),
        signal: ctrl.current.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Could not generate a recommendation.");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((t) => t + dec.decode(value, { stream: true }));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Connection interrupted. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" /> AI packaging advisor</h3>
        <PrototypeBadge label="AI-generated · verify before use" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Pre-filled from this analysis. Edit anything, then generate a tailored recommendation with tradeoffs and cautions.</p>
      <div className="mt-4 grid gap-3">
        <div className="space-y-1.5"><Label htmlFor="ai-c" className="text-xs">Commodity</Label><Input id="ai-c" maxLength={80} value={commodity} onChange={(e) => setCommodity(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="ai-s" className="text-xs">Storage conditions</Label><Textarea id="ai-s" rows={3} maxLength={600} value={storage} onChange={(e) => setStorage(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="ai-r" className="text-xs">Analysis results</Label><Textarea id="ai-r" rows={5} maxLength={4000} value={results} onChange={(e) => setResults(e.target.value)} /></div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => void run()} disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {busy ? "Generating…" : "Generate AI recommendation"}</Button>
        {busy && <Button variant="ghost" onClick={() => ctrl.current?.abort()}>Stop</Button>}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {text && <div className="mt-5 space-y-1 rounded-2xl bg-secondary/50 p-4" aria-live="polite">{renderMd(text)}</div>}
    </GlassCard>
  );
}
