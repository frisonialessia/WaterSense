"use client";

import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea, Tooltip, ResponsiveContainer } from "recharts";
import type { AquiferProjection } from "@/lib/brain/aquiferModel";
import { C, cardStyle, fmt, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";

// Presentation framing that matches the model defaults in /api/aquifer.
const START_LEVEL = 78;
const CRITICAL_LEVEL = 140;
const BASE_YEAR = 2026;

interface Levers {
  extraction: number;
  rainReuse: number;
  drainReuse: number;
  rechargeMAR: number;
  wastewaterReuse: number;
  runoffCapture: number;
  neighbors: number;
}

const ZERO: Levers = { extraction: 100, rainReuse: 0, drainReuse: 0, rechargeMAR: 0, wastewaterReuse: 0, runoffCapture: 0, neighbors: 3 };

async function fetchProjection(l: Levers): Promise<AquiferProjection> {
  const res = await fetch("/api/aquifer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      extractionFactor: l.extraction / 100,
      neighbors: l.neighbors,
      rainReuse: l.rainReuse / 100,
      drainReuse: l.drainReuse / 100,
      rechargeMAR: l.rechargeMAR / 100,
      wastewaterReuse: l.wastewaterReuse / 100,
      runoffCapture: l.runoffCapture / 100,
    }),
  });
  return res.json();
}

export function FuturoView({ th, tr }: { th: Theme; tr: (s: string, t: string) => string }) {
  const [lev, setLev] = useState<Levers>({ ...ZERO });
  const [proj, setProj] = useState<AquiferProjection | null>(null);
  const [base, setBase] = useState<AquiferProjection | null>(null);
  const [loading, setLoading] = useState(false);

  // baseline (do-nothing) fetched once from the brain
  useEffect(() => {
    fetchProjection({ ...ZERO }).then(setBase);
  }, []);

  // current scenario, debounced so dragging a slider doesn't spam the API
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetchProjection(lev)
        .then(setProj)
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [lev]);

  const survives = proj?.survives ?? true;
  const limitYear = proj?.limitYear ?? null;
  const yearsGained = proj?.yearsGained ?? 0;
  const planColor = survives ? C.emerald : C.critical;

  // ── Consequence simulator: how your zone & Chihuahua would look ──
  const yearsLeft = survives ? 30 : Math.max(0, (limitYear ?? BASE_YEAR) - BASE_YEAR);
  const sev: "ok" | "watch" | "risk" = survives || yearsLeft >= 25 ? "ok" : yearsLeft >= 12 ? "watch" : "risk";
  const sevColor = sev === "risk" ? C.critical : sev === "watch" ? C.alert : C.emerald;
  const zonaPct = Math.max(5, Math.min(100, Math.round((yearsLeft / 30) * 100)));
  const chihPct = Math.max(3, zonaPct - 15);

  const data = (proj?.levels ?? []).map((v, i) => ({
    year: BASE_YEAR + i,
    plan: Math.round(v),
    base: base ? Math.round(base.levels[i]) : undefined,
  }));

  const reuseSum = lev.rainReuse + lev.drainReuse + lev.rechargeMAR + lev.wastewaterReuse + lev.runoffCapture;
  const capex = Math.round(lev.rainReuse * 900 + lev.drainReuse * 1400 + lev.rechargeMAR * 2000 + lev.wastewaterReuse * 1100 + lev.runoffCapture * 600);
  const payback = Math.max(1, Math.round(capex / Math.max(1, reuseSum * 180)));

  const presets: { n: string; v: Levers }[] = [
    { n: tr("No hacer nada", "Línea base"), v: { ...ZERO } },
    { n: tr("Sobreexplotación", "Sobreexplotación"), v: { ...ZERO, extraction: 125, neighbors: 6 } },
    { n: tr("Plan conservador", "Conservador"), v: { ...ZERO, extraction: 90, rainReuse: 30, drainReuse: 15, runoffCapture: 20 } },
    { n: tr("Plan agresivo", "Agresivo"), v: { ...ZERO, extraction: 70, rainReuse: 70, drainReuse: 50, wastewaterReuse: 40 } },
    { n: tr("Plan regenerativo", "Regenerativo"), v: { ...ZERO, extraction: 60, rainReuse: 100, drainReuse: 80, rechargeMAR: 60, wastewaterReuse: 60, runoffCapture: 50, neighbors: 2 } },
  ];

  const Lever = ({ label, sub, k, min, max, unit, color, cost }: { label: string; sub: string; k: keyof Levers; min: number; max: number; unit: string; color: string; cost?: string }) => (
    <div style={{ marginBottom: space.lg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: fz.sm, fontWeight: 500 }}>{label}</span>
        <span className="mono" style={{ fontSize: fz.sm, fontWeight: 700, color }}>{lev[k]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={lev[k]} onChange={(e) => setLev((s) => ({ ...s, [k]: +e.target.value }))} style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 3 }}>
        <span style={{ fontSize: fz.micro, color: th.mute }}>{sub}</span>
        {cost && lev[k] > 0 && <span className="mono" style={{ fontSize: fz.micro, color: th.soft, whiteSpace: "nowrap" }}>{cost}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ padding: space.x3 }}>
      {/* headline — the one brand-gradient moment */}
      <div className="card" style={{ borderRadius: radius.lg, padding: `${space.x2}px ${space.x2}px`, marginBottom: space.md, position: "relative", overflow: "hidden", color: "#fff", background: `linear-gradient(110deg,${C.brandNavy},${C.glacier} 60%,${C.emerald})` }}>
        <p style={{ fontSize: fz.sm, color: "rgba(255,255,255,.85)", marginBottom: space.sm }}>
          {tr("Con tus decisiones actuales, tu pozo principal", "Proyección de viabilidad del pozo principal")}
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: space.md, flexWrap: "wrap" }}>
          {survives ? (
            <>
              <span style={{ fontWeight: 700, fontSize: fz.xl }}>{tr("aguanta más de 30 años", "viable +30 años")}</span>
              <span style={{ fontSize: fz.md, color: "rgba(255,255,255,.9)" }}>{tr("si mantienes este plan", "escenario sostenible")}</span>
            </>
          ) : (
            <>
              <span className="mono" style={{ fontWeight: 700, fontSize: "clamp(30px, 10vw, 42px)" }}>{limitYear}</span>
              <span style={{ fontSize: fz.md, color: "rgba(255,255,255,.9)" }}>
                {tr(`es el año en que tu pozo dejaría de dar agua (faltan ${(limitYear ?? BASE_YEAR) - BASE_YEAR} años)`, `año de inviabilidad estimado · ${(limitYear ?? BASE_YEAR) - BASE_YEAR} años`)}
              </span>
            </>
          )}
        </div>
        <div style={{ marginTop: space.md, display: "flex", gap: space.sm, flexWrap: "wrap" }}>
          {!survives && <span style={{ fontSize: fz.xs, fontWeight: 600, background: "rgba(255,255,255,.2)", padding: "4px 11px", borderRadius: radius.pill }}>● {tr("requiere atención", "horizonte ajustado")}</span>}
          {yearsGained > 0 && <span style={{ fontSize: fz.xs, fontWeight: 600, background: "rgba(255,255,255,.2)", padding: "4px 11px", borderRadius: radius.pill }}>{tr(`+${yearsGained} años ganados vs. no hacer nada`, `+${yearsGained} años vs. línea base`)}</span>}
        </div>
      </div>

      {/* scenario presets */}
      <div style={{ display: "flex", gap: space.sm, marginBottom: space.lg, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: fz.xs, color: th.mute, marginRight: 4 }}>{tr("Escenarios:", "Escenarios:")}</span>
        {presets.map((p, i) => (
          <button key={i} onClick={() => setLev(p.v)} style={{ fontSize: fz.xs, fontWeight: 500, padding: "7px 14px", borderRadius: radius.pill, cursor: "pointer", border: `1px solid ${th.line}`, background: th.panel, color: th.ink }}>{p.n}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 360px),1fr))", gap: space.lg }}>
        {/* levers */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{tr("Mueve las palancas", "Variables del escenario")}</div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.lg }}>{tr("Cambia tus decisiones y mira cómo cambia tu futuro", "Ajusta y observa la proyección")}</div>
          <Lever label={tr("Cuánta agua extraes", "Extracción")} sub={tr("100% = lo que sacas hoy", "% de extracción actual")} k="extraction" min={50} max={130} unit="%" color={C.glacier} />
          <Lever label={tr("Reúsas agua de lluvia", "Reúso de lluvia")} sub={tr("Captar lluvia reduce lo que sacas", "% de lluvia captada")} k="rainReuse" min={0} max={100} unit="%" color={C.emerald} cost={`~$${fmt(Math.round(lev.rainReuse * 900))}`} />
          <Lever label={tr("Reúsas agua de drenaje", "Reúso de drenaje")} sub={tr("Tratar y reusar drenaje agrícola", "% de drenaje reusado")} k="drainReuse" min={0} max={100} unit="%" color={C.emerald} cost={`~$${fmt(Math.round(lev.drainReuse * 1400))}`} />
          <Lever label={tr("Recargas tu acuífero", "Recarga gestionada (MAR)")} sub={tr("Metes agua de vuelta al subsuelo con balsas de infiltración o pozos de inyección.", "Infiltración / inyección al acuífero")} k="rechargeMAR" min={0} max={100} unit="%" color={C.glacier} cost={`~$${fmt(Math.round(lev.rechargeMAR * 2000))}`} />
          <Lever label={tr("Reúsas agua tratada", "Aguas residuales tratadas")} sub={tr("Agua de la ciudad o de proceso, ya tratada, para regar en vez de sacar del pozo.", "Reúso de agua residual tratada")} k="wastewaterReuse" min={0} max={100} unit="%" color={C.emerald} cost={`~$${fmt(Math.round(lev.wastewaterReuse * 1100))}`} />
          <Lever label={tr("Atrapas escurrimientos", "Captación de escurrimientos")} sub={tr("Bordos, ollas de agua y presas de gaviones que detienen la lluvia para que se infiltre.", "Bordos / ollas / check dams")} k="runoffCapture" min={0} max={100} unit="%" color={C.emerald} cost={`~$${fmt(Math.round(lev.runoffCapture * 600))}`} />
          <Lever label={tr("Vecinos en tu acuífero", "Usuarios del acuífero")} sub={tr("Otros que sacan del mismo acuífero. No lo controlas, pero afecta tu futuro.", "Extractores compartiendo el acuífero")} k="neighbors" min={0} max={8} unit="" color={C.alert} />
          {reuseSum > 0 && (
            <div style={{ marginTop: 6, padding: `${space.md}px ${space.md}px`, borderRadius: radius.md, background: `${C.emerald}10`, border: `1px solid ${C.emerald}30`, fontSize: fz.xs, color: th.ink, lineHeight: 1.5 }}>
              {tr(`Inversión total ~$${fmt(capex)}. Se paga en ~${payback} años y te da +${yearsGained} años de pozo.`, `Capex ~$${fmt(capex)} · payback ~${payback} años · +${yearsGained} años de vida útil.`)}
            </div>
          )}
        </div>

        {/* projection chart */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{tr("Nivel del agua bajo tierra", "Profundidad del nivel freático")}</div>
            {loading && <span style={{ fontSize: fz.micro, color: th.mute }}>{tr("calculando…", "calc…")}</span>}
          </div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Cuanto más baja la línea, más profundo está el agua", "metros al nivel freático · proyección")}</div>
          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="futuroLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.emerald} />
                    <stop offset="55%" stopColor={C.alert} />
                    <stop offset="100%" stopColor={C.critical} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={th.line} strokeDasharray="3 3" vertical={false} />
                <ReferenceArea y1={CRITICAL_LEVEL} y2={CRITICAL_LEVEL + 12} fill={C.critical} fillOpacity={0.08} />
                <ReferenceLine y={CRITICAL_LEVEL} stroke={C.critical} strokeDasharray="5 4" label={{ value: tr("pozo inviable", "límite crítico"), position: "insideTopLeft", fontSize: 10, fill: C.critical }} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: th.mute }} stroke={th.line} ticks={[BASE_YEAR, BASE_YEAR + 10, BASE_YEAR + 20, BASE_YEAR + 30]} />
                <YAxis reversed domain={[60, CRITICAL_LEVEL + 12]} tick={{ fontSize: 10, fill: th.mute }} stroke={th.line} width={40} tickFormatter={(v) => `${v}m`} />
                <Tooltip
                  contentStyle={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.md, fontSize: 12 }}
                  labelStyle={{ color: th.ink }}
                  formatter={(v: number, n) => [`${v} m`, n === "plan" ? tr("tu plan", "escenario") : tr("no hacer nada", "línea base")]}
                />
                <Line type="monotone" dataKey="base" stroke={th.mute} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="plan" stroke="url(#futuroLine)" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: space.lg, marginTop: space.sm, fontSize: fz.micro, color: th.soft }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, height: 2.5, background: `linear-gradient(90deg,${C.emerald},${C.alert},${C.critical})` }} />{tr("tu plan", "escenario")}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 16, borderTop: `2px dashed ${th.mute}` }} />{tr("si no haces nada", "línea base")}</span>
          </div>
        </div>
      </div>

      {/* Consequence simulator: your zone & Chihuahua */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginTop: space.md }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{tr("¿Y si no se cumple el plan?", "Simulador de consecuencias")}</div>
        <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.lg }}>{tr("Cómo se vería el agua de tu zona y de Chihuahua con el escenario actual", "Disponibilidad proyectada: tu zona vs. estado")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 280px),1fr))", gap: space.md }}>
          {[
            { name: tr("Tu zona · Meoqui-Delicias", "Acuífero Meoqui-Delicias"), pct: zonaPct },
            { name: tr("Chihuahua (acuíferos)", "Chihuahua · agregado"), pct: chihPct },
          ].map((z) => {
            const zc = z.pct >= 60 ? C.emerald : z.pct >= 30 ? C.alert : C.critical;
            return (
              <div key={z.name} style={{ border: `1px solid ${th.line}`, borderRadius: radius.md, overflow: "hidden" }}>
                <div style={{ position: "relative", height: 96, background: `linear-gradient(180deg, ${th.panel2}, ${zc}22)` }}>
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${z.pct}%`, background: `${zc}33`, borderTop: `2px solid ${zc}`, transition: "height .4s" }} />
                  <span className="mono" style={{ position: "absolute", top: 8, left: 10, fontSize: fz.lg, fontWeight: 700, color: zc }}>{z.pct}%</span>
                  <span style={{ position: "absolute", top: 13, right: 10, fontSize: fz.micro, color: th.soft }}>{tr("agua disponible", "disponibilidad")}</span>
                </div>
                <div style={{ padding: `${space.sm}px ${space.md}px` }}>
                  <div style={{ fontSize: fz.sm, fontWeight: 600 }}>{z.name}</div>
                  <div style={{ fontSize: fz.xs, color: th.soft, marginTop: 2 }}>
                    {z.pct >= 60
                      ? tr("Sostenible si se mantiene el plan.", "Disponibilidad estable.")
                      : z.pct >= 30
                        ? tr("Bajo presión: el agua se reduce año con año.", "Bajo presión.")
                        : tr("Crítico: riesgo de quedarse sin agua para riego.", "Crítico.")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: space.md, fontSize: fz.xs, color: th.ink, padding: `${space.sm}px ${space.md}px`, borderRadius: radius.md, background: `${sevColor}12`, border: `1px solid ${sevColor}33`, lineHeight: 1.5 }}>
          {survives
            ? tr("Con este plan tu zona se mantiene. Si todos en Chihuahua hicieran lo mismo, el acuífero aguanta.", "Escenario sostenible a nivel zona; replicable a escala estatal.")
            : tr(`Si no se cumple, tu pozo llega a su límite hacia ${limitYear}. A escala Chihuahua, miles de hectáreas quedarían sin riego.`, `Inviabilidad local ~${limitYear}; impacto agregado severo a escala estatal.`)}
        </div>
      </div>

      <p style={{ fontSize: fz.xs, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
        {tr(
          "Esta es una proyección de demostración con un modelo simulado. Con datos reales del acuífero (niveles históricos de CONAGUA, tu extracción medida y el clima), la predicción sería específica de tu pozo.",
          "Proyección de demostración · modelo simulado (motor en /api/aquifer). Estructura lista para datos reales de CONAGUA (piezometría), extracción medida y clima."
        )}
      </p>
    </div>
  );
}
