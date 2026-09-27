import type { StoredAnalysis } from "./types";

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

export function buildReportHtml(a: StoredAnalysis): string {
  const { input, result } = a;
  const row = (k: string, v: unknown) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>PACKWISE AI Report — ${esc(input.commodity)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:820px;margin:40px auto;color:#1f2a37;padding:0 20px}h1{color:#2f8a5b}
table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;font-size:14px}th{width:40%;color:#555}
.note{background:#f3f5f2;padding:12px;border-radius:10px;font-size:12px;color:#555}</style></head><body>
<h1>PACKWISE AI — Packaging Recommendation</h1>
<p>Generated ${esc(new Date(a.createdAt).toLocaleString())}</p>
<h2>Product</h2><table>${row("Commodity", input.commodity)}${row("Category", input.category)}${row("Moisture", input.moisture + "%")}${row("Oil / fat", input.oil + "%")}${row("pH", input.ph)}${row("Respiration", input.respiration)}${row("Storage", `${input.storageType}, ${input.temperature}°C, ${input.humidity}% RH`)}${row("Target shelf life", input.shelfLifeTarget + " days")}${row("Transport", `${input.transportMode}, ${input.transportHours} h`)}</table>
<h2>Recommendation</h2><table>${row("Material", result.materialName)}${row("Compatibility", result.compatibility + "%")}${row("Indicative shelf life", `${result.shelfLife.min}–${result.shelfLife.max} days`)}${row("OTR", result.specifications.otr)}${row("WVTR", result.specifications.wvtr)}${row("Thickness", result.specifications.thickness)}${row("Sealability", result.specifications.sealability)}${row("Mechanical", result.specifications.mechanical)}${row("MAP", result.specifications.map)}</table>
<h2>Why this material</h2><ul>${result.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
<h2>Alternatives</h2><table>${result.alternatives.map((x) => row(`${x.focus}: ${x.name}`, `${x.compatibility}% — ${x.use}`)).join("")}</table>
${result.mapConditions.applicable ? `<h2>MAP conditions</h2><table>${row("O₂", result.mapConditions.o2)}${row("CO₂", result.mapConditions.co2)}${row("N₂", result.mapConditions.n2)}</table>` : ""}
<p class="note">Prototype decision-support output. Values are indicative and must be validated with packaging suppliers and laboratory shelf-life testing.</p>
</body></html>`;
}

export function downloadReport(a: StoredAnalysis) {
  const blob = new Blob([buildReportHtml(a)], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `packwise-${a.input.commodity.toLowerCase().replace(/\s+/g, "-") || "report"}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
