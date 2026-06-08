// POST /api/study — generates a professional irrigation study.
// Builds the facts from the repository + brain (yield, aquifer, pump health,
// decision). With ANTHROPIC_API_KEY it asks Claude to write it up like an
// agronomist; without a key it returns a structured local study. Zero-config.
import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data/repository";
import { getTenantContextFromRequest } from "@/lib/security/authContext";
import { studySchema } from "@/lib/validation/schemas";
import { assessPump } from "@/lib/brain/pumpHealth";
import { projectYield } from "@/lib/brain/yieldModel";
import { projectAquifer } from "@/lib/brain/aquiferModel";
import { fmt } from "@/lib/theme";

export async function POST(req: NextRequest) {
  try {
    // Cuerpo opcional: tolera vacío o malformado (default seguro).
    const raw = await req.json().catch(() => ({}));
    const parsed = studySchema.safeParse(raw);
    const ranchName = (parsed.success ? parsed.data.ranchName : undefined) || "tu rancho";

    const repo = getRepository(await getTenantContextFromRequest(req));
    const [parcels, wells, crops, costs] = await Promise.all([
      repo.getParcels(),
      repo.getWells(),
      repo.getCrops(),
      repo.getCosts(),
    ]);
    const cropMap = Object.fromEntries(crops.map((c) => [c.crop, c]));

    const pumps = wells.map((w) => assessPump(w, w.ok ? 0 : 18));
    const aq = projectAquifer({ startLevelM: 78, criticalLevelM: 140, rechargeMPerYear: 2.2, baseExtractionM: 3.4, extractionFactor: 1, neighbors: 3, neighborDrawM: 0.9, rainReuse: 0, drainReuse: 0, rechargeMAR: 0, wastewaterReuse: 0, runoffCapture: 0, horizonYears: 30, baseYear: new Date().getFullYear() });

    const parcelLines = parcels.map((p) => {
      const c = cropMap[p.crop];
      const y = c ? projectYield({ yieldKgHa: c.yieldKgHa, hectares: p.hectares, stress: p.stress, pricePerKg: c.pricePerKg }) : null;
      return `- ${p.name}: ${p.crop}, ${p.hectares} ha, sed ${(p.stress * 100).toFixed(0)}%${c ? `, riega cada ${c.freqDays} d, agua ${fmt(Math.round(c.waterM3ha * p.hectares))} m³/año, ingreso proyectado $${fmt(y?.revenue ?? 0)} (${y?.pct ?? 0}% del potencial)` : ""}`;
    });
    const wellLines = wells.map((w) => {
      const ph = pumps.find((x) => x.wellId === w.id);
      return `- ${w.name}: ${fmt(w.currentFlowLph)}/${fmt(w.sustainableFlowLph)} L/h (${w.ok ? "dentro del límite" : "SOBREEXPLOTADO"}), salud bomba ${ph?.health ?? "—"}% (${ph?.note ?? ""})`;
    });
    const totalCost = costs.reduce((s, c) => s + c.month, 0);

    const facts = `RANCHO: ${ranchName} (Delicias, Chihuahua; acuífero Meoqui-Delicias, sobreexplotado).
PARCELAS:
${parcelLines.join("\n")}
POZOS:
${wellLines.join("\n")}
COSTOS OPERATIVOS: $${fmt(totalCost)}/mes (mayor rubro: ${[...costs].sort((a, b) => b.month - a.month)[0]?.label}).
ACUÍFERO: ${aq.survives ? "viable +30 años con el plan actual" : `inviable hacia ${aq.limitYear}, caída ${aq.annualDropM.toFixed(2)} m/año`}.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1600,
            system:
              "Eres un agrónomo experto en riego de zonas áridas del norte de México. Redacta un ESTUDIO DE RIEGO profesional, claro y accionable en español, a partir de los datos dados. Estructura: 1) Resumen ejecutivo, 2) Diagnóstico por parcela, 3) Pozos y acuífero, 4) Plan de riego y energía recomendado, 5) Riesgos y prioridades. Sé concreto y honesto: aclara que los datos son simulados (demostración).",
            messages: [{ role: "user", content: `Genera el estudio con estos datos:\n\n${facts}` }],
          }),
        });
        const data = await res.json();
        const text = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("\n");
        if (text) return NextResponse.json({ text, mode: "claude" });
      } catch {
        /* fall through to local */
      }
    }

    // Local structured study (no key).
    const worst = [...parcels].sort((a, b) => b.stress - a.stress)[0];
    const overdrawn = wells.filter((w) => !w.ok);
    const text = `ESTUDIO DE RIEGO — ${ranchName}
Delicias, Chihuahua · ${new Date().toLocaleDateString("es-MX")}
(Demostración con datos simulados)

1. RESUMEN EJECUTIVO
${parcels.length} parcelas y ${wells.length} pozos analizados. ${overdrawn.length ? `Atención: ${overdrawn.map((w) => w.name).join(", ")} por encima del caudal sostenible.` : "Pozos dentro de su límite sostenible."} El acuífero Meoqui-Delicias está sobreexplotado: ${aq.survives ? "el pozo principal se proyecta viable más de 30 años con el plan actual" : `el pozo principal se proyectaría inviable hacia ${aq.limitYear}`}.

2. DIAGNÓSTICO POR PARCELA
${parcelLines.join("\n")}
Prioridad de riego: ${worst ? `${worst.name} (sed ${(worst.stress * 100).toFixed(0)}%)` : "—"}.

3. POZOS Y ACUÍFERO
${wellLines.join("\n")}
El acuífero está sobreexplotado; conviene repartir el bombeo y considerar reúso de agua (lluvia/drenaje) para extender la vida útil.

4. PLAN DE RIEGO Y ENERGÍA
- Concentrar el riego pesado en la madrugada (tarifa eléctrica más baja).
- Repartir el bombeo entre pozos para evitar picos de arranque y proteger las bombas.
- Pausar riego ante lluvia prevista.
- Costo operativo actual: $${fmt(totalCost)}/mes.

5. RIESGOS Y PRIORIDADES
${overdrawn.length ? `- Reducir extracción en ${overdrawn.map((w) => w.name).join(", ")}.` : "- Mantener vigilancia de caudales."}
- Mantenimiento preventivo de bombas con salud baja antes de la temporada alta.
- Validar el modelo del acuífero con datos reales de CONAGUA antes de decisiones de inversión.

Nota: estudio de demostración generado por WaterSense con datos simulados. Con datos reales (sensores, CONAGUA, CENACE) sería específico de tu operación.`;

    return NextResponse.json({ text, mode: "local" });
  } catch {
    return NextResponse.json({ error: "No se pudo generar el estudio." }, { status: 400 });
  }
}
