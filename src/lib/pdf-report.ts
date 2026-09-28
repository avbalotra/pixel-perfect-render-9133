import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { computeMap } from "@/components/Calculators";
import type { StoredAnalysis } from "./types";

// jsPDF core fonts lack subscripts/special glyphs
const t = (v: unknown) => String(v ?? "").replace(/₂/g, "2").replace(/[–—]/g, "-").replace(/µ/g, "u").replace(/°/g, " deg").replace(/[^\x20-\x7E]/g, "");

export function downloadPdfReport(a: StoredAnalysis) {
  const { input, result } = a;
  const doc = new jsPDF();
  const green: [number, number, number] = [47, 138, 91];
  let y = 18;
  doc.setFontSize(18); doc.setTextColor(...green); doc.text("PACKWISE AI - Packaging Report", 14, y);
  doc.setFontSize(10); doc.setTextColor(90); doc.text(t(`${input.commodity} | Generated ${new Date(a.createdAt).toLocaleString()}`), 14, (y += 7));

  const section = (title: string, rows: [string, unknown][]) => {
    autoTable(doc, {
      startY: y + 6,
      head: [[title, ""]],
      body: rows.map(([k, v]) => [t(k), t(v)]),
      theme: "striped",
      headStyles: { fillColor: green },
      styles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 60, fontStyle: "bold" } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  };

  section("Inputs", [
    ["Commodity", input.commodity], ["Category", input.category], ["Product form", input.productForm],
    ["Moisture", `${input.moisture}%`], ["Oil / fat", `${input.oil}%`], ["pH", input.ph], ["Respiration", input.respiration],
    ["Sensitivities", input.sensitivities.join(", ") || "None"],
    ["Storage", `${input.storageType}, ${input.temperature}°C, ${input.humidity}% RH`],
    ["Target shelf life", `${input.shelfLifeTarget} days`],
    ["Transport", `${input.transportMode}, ${input.transportHours} h, mechanical risk ${input.mechanicalRisk}`],
  ]);
  section("Results", [
    ["Recommended material", result.materialName], ["Compatibility", `${result.compatibility}%`],
    ["Indicative shelf life", `${result.shelfLife.min}–${result.shelfLife.max} days`],
    ["OTR", result.specifications.otr], ["WVTR", result.specifications.wvtr], ["Thickness", result.specifications.thickness],
    ["Sealability", result.specifications.sealability], ["Mechanical", result.specifications.mechanical],
    ...result.reasons.map((r, i) => [`Reason ${i + 1}`, r] as [string, unknown]),
    ...result.alternatives.map((x) => [`Alt (${x.focus})`, `${x.name} - ${x.compatibility}%`] as [string, unknown]),
  ]);
  const gas = computeMap(input.respiration, input.temperature, input.shelfLifeTarget);
  section("Gas mix (indicative MAP)", [["O₂", gas.o2], ["CO₂", gas.co2], ["N₂", gas.n2], ["Applicable", result.mapConditions.applicable ? "Yes" : "Not typically required"]]);

  // Default cost assumptions mirror the in-app cost calculator.
  const thk = Number((result.specifications.thickness ?? "").match(/\d+/)?.[0] ?? 50);
  const costKg = 220, len = 25, wid = 18, density = 0.93, qty = 10000;
  const grams = 2 * len * wid * thk * 1e-4 * density;
  const perPkg = (grams / 1000) * costKg;
  section("Cost estimate (material only)", [
    ["Assumptions", `INR ${costKg}/kg, ${thk} um, ${len}x${wid} cm pouch, ${density} g/cm3`],
    ["Film mass per pouch", `${grams.toFixed(2)} g`], ["Cost per package", `INR ${perPkg.toFixed(3)}`],
    [`Total for ${qty.toLocaleString()}`, `INR ${Math.round(perPkg * qty).toLocaleString()}`],
  ]);

  doc.setFontSize(8); doc.setTextColor(120);
  doc.text(doc.splitTextToSize("Prototype decision-support output. Values are indicative and must be validated with packaging suppliers and laboratory shelf-life testing.", 180), 14, Math.min(y + 10, 285));
  doc.save(`packwise-${input.commodity.toLowerCase().replace(/\s+/g, "-") || "report"}.pdf`);
}
