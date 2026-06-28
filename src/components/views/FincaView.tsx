"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import type { Parcel, WeatherDay, ScheduledAction, SavingsSummary, CropProfile, CropType, TariffType } from "@/types/domain";
import { projectYield } from "@/lib/brain/yieldModel";
import { assessStressRisk } from "@/lib/brain/stressRisk";
import { KWH_PER_M3, WATER_RATE, M3_PER_HA_EVENT, OPEX_SHIFT_KWH_HA_MONTH } from "@/lib/brain/energyWater";
// El ahorro operativo del mes se ESTIMA de los datos reales del usuario
// (superficie de sus parcelas × diferencial tarifario en vivo). Todo lo demás
// (acción de hoy, what-if por hora) se deriva de él para que NO se contradiga.
import { C, FONT, cardStyle, fmt, space, fz, radius, labelStyle, stressColor, type Theme, type Lang } from "@/lib/theme";
import { Icon } from "../Icon";
import type { ViewId } from "../Sidebar";

function useCount(target: number, dur = 1100) {
  const [v, setV] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    started.current = false;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, dur]);
  return Math.round(v);
}

const TONE: Record<ScheduledAction["tone"], string> = { emerald: C.emerald, alert: C.alert, glacier: C.glacier };

export function FincaView({
  th,
  tr,
  lang,
  setView,
  parcels,
  crops,
  tariffCurve,
  tariffType,
  lat,
  lng,
  forecast,
  actions,
  savings,
}: {
  th: Theme;
  tr: (s: string, t: string) => string;
  lang: Lang;
  setView: (v: ViewId) => void;
  parcels: Parcel[];
  crops: CropProfile[];
  tariffCurve: number[];
  tariffType: TariffType;
  lat: number;
  lng: number;
  forecast: WeatherDay[];
  actions: ScheduledAction[];
  savings: SavingsSummary;
}) {
  const [done, setDone] = useState(false);
  // Modo Simple = una decisión arriba y el detalle analítico colapsado.
  // Técnico = todo desplegado. El usuario puede alternar.
  const [showDetail, setShowDetail] = useState(lang === "tech");
  useEffect(() => setShowDetail(lang === "tech"), [lang]);

  // Real Chihuahua weather via Open-Meteo (free, no key). Falls back to the
  // simulated forecast if the call fails (offline / blocked).
  const [liveForecast, setLiveForecast] = useState<WeatherDay[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,precipitation_sum&forecast_days=5&timezone=auto`, { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((d) => {
        const t: string[] = d?.daily?.time;
        const tmax: number[] = d?.daily?.temperature_2m_max;
        const pr: number[] = d?.daily?.precipitation_sum;
        if (!t || !tmax || !pr) return;
        const days: WeatherDay[] = t.slice(0, 5).map((iso, i) => {
          const rainMm = Math.round(pr[i] ?? 0);
          const icon = rainMm >= 3 ? "rain" : rainMm >= 0.5 ? "cloud" : "sun";
          const wd = i === 0 ? "Hoy" : new Date(`${iso}T12:00`).toLocaleDateString("es-MX", { weekday: "short" });
          return { day: wd.charAt(0).toUpperCase() + wd.slice(1, 3), icon, tempMax: Math.round(tmax[i]), rainMm };
        });
        if (!cancelled) setLiveForecast(days);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);
  const fc = liveForecast ?? forecast;
  const rainDay = fc.find((f) => f.rainMm >= 10);
  const today = fc[0];
  const restDays = fc.slice(1);
  const maxTemp = fc.length ? Math.max(...fc.map((f) => f.tempMax)) : 0;
  const condition = (f: WeatherDay) => (f.icon === "rain" ? "Lluvia" : f.icon === "cloud" ? "Nublado" : "Despejado");

  const cropMap = useMemo(() => {
    const m = {} as Record<CropType, CropProfile>;
    crops.forEach((c) => (m[c.crop] = c));
    return m;
  }, [crops]);

  // ── Predicción de cosecha (farm-level) ─────────────────────
  const harvest = useMemo(() => {
    let revenue = 0,
      lost = 0;
    for (const p of parcels) {
      const c = cropMap[p.crop];
      if (!c) continue;
      const y = projectYield({ yieldKgHa: c.yieldKgHa, hectares: p.hectares, stress: p.stress, pricePerKg: c.pricePerKg });
      revenue += y.revenue;
      lost += y.lostRevenue;
    }
    const potential = revenue + lost;
    const pct = potential ? Math.round((revenue / potential) * 100) : 100;
    return { revenue, lost, pct };
  }, [parcels, cropMap]);

  // ── Punto de no retorno (most-stressed parcel) ─────────────
  const risk = useMemo(() => {
    const driest = [...parcels].sort((a, b) => b.stress - a.stress)[0];
    const c = driest ? cropMap[driest.crop] : undefined;
    if (!driest || !c) return null;
    const r = assessStressRisk({ stress: driest.stress, hectares: driest.hectares, yieldKgHa: c.yieldKgHa, pricePerKg: c.pricePerKg });
    return { ...r, parcel: driest };
  }, [parcels, cropMap]);
  const riskColor = risk ? stressColor(risk.parcel.stress) : C.alert;
  // Riesgo urgente = la decisión del día. Si no hay, el panel se ve "en orden".
  const urgentRisk = risk && risk.level !== "ok" ? risk : null;

  // ── What-if: hora de riego → ahorro en vivo ────────────────
  const cheapest = useMemo(() => (tariffCurve.length ? tariffCurve.indexOf(Math.min(...tariffCurve)) : 2), [tariffCurve]);
  const peakPrice = useMemo(() => (tariffCurve.length ? Math.max(...tariffCurve) : 2.6), [tariffCurve]);
  const minPrice = useMemo(() => (tariffCurve.length ? Math.min(...tariffCurve) : 0.6), [tariffCurve]);
  const [waterHour, setWaterHour] = useState(cheapest);
  useEffect(() => setWaterHour(cheapest), [cheapest]);

  // ── Una sola historia de "ahorro operativo" (luz + agua) ─────
  // Se ESTIMA de los datos reales del usuario: su superficie total × los kWh/ha
  // que se pueden mover al horario barato × el diferencial tarifario en vivo
  // (pico − barato). Reacciona cuando el usuario agrega/edita parcelas o cuando
  // cambia el precio de luz. Todo lo demás se deriva de aquí:
  //   • cover         = ahorro del mes (regar en la ventana barata)
  //   • what-if(hora) = ese ahorro escalado por lo barata que sea la hora
  //   • acción de hoy = la parte de una noche (≈ mes / 30)
  const totalHa = useMemo(() => parcels.reduce((s, p) => s + p.hectares, 0), [parcels]);
  const opSavingMonth = useMemo(
    () => Math.round(totalHa * OPEX_SHIFT_KWH_HA_MONTH * Math.max(0, peakPrice - minPrice)),
    [totalHa, peakPrice, minPrice]
  );
  const nightlySaving = Math.max(1, Math.round(opSavingMonth / 30));
  const saved = useCount(opSavingMonth);
  const priceAt = tariffCurve[waterHour] ?? 1.8;
  const hourSpan = Math.max(0.001, peakPrice - minPrice);
  const hourFactor = Math.max(0, Math.min(1, (peakPrice - priceAt) / hourSpan));
  const whatIfSaved = Math.round(opSavingMonth * hourFactor);

  const decisionColor = urgentRisk ? riskColor : C.emerald;

  // "Programar riego" registra de verdad el riego recomendado en la Bitácora
  // (localStorage 'watersense.riegos'): cuenta en el control de concesión y
  // aparece en el reporte CONAGUA. No es un botón decorativo.
  const programar = () => {
    if (done) return;
    track("programar_riego");
    const p = urgentRisk?.parcel ?? [...parcels].sort((a, b) => b.stress - a.stress)[0];
    if (p) {
      try {
        const raw = localStorage.getItem("watersense.riegos");
        const list = raw ? JSON.parse(raw) : [];
        const m3 = Math.round(p.hectares * M3_PER_HA_EVENT);
        const kwh = Math.round(m3 * KWH_PER_M3);
        const entry = {
          id: `riego-${Date.now()}`,
          parcelId: p.id,
          parcelName: p.name,
          wellId: "",
          wellName: "—",
          date: new Date().toISOString().slice(0, 10),
          hours: Math.round((m3 / 6) * 10) / 10,
          m3,
          hour: cheapest,
          kwh,
          energyCost: Math.round(kwh * (tariffCurve[cheapest] ?? 1.5)),
          waterCost: Math.round(m3 * WATER_RATE),
        };
        localStorage.setItem("watersense.riegos", JSON.stringify([entry, ...(Array.isArray(list) ? list : [])]));
      } catch {
        /* ignore */
      }
    }
    setDone(true);
  };

  return (
    <div style={{ padding: space.x3 }}>
      {/* ── Decisión de hoy (héroe): la acción prioritaria, no una franja ── */}
      <div className="card" style={{ ...cardStyle(th), marginBottom: space.md, padding: 0, overflow: "hidden", display: "flex" }}>
        <div style={{ width: 6, background: decisionColor, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: space.x2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: space.sm, marginBottom: space.sm }}>
            <span style={{ width: 30, height: 30, borderRadius: radius.md, background: `${decisionColor}1f`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="drop" size={17} color={decisionColor} />
            </span>
            <span style={labelStyle(th)}>{tr("Tu decisión de hoy", "Acción prioritaria")}</span>
          </div>
          <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: th.ink, lineHeight: 1.15 }}>
            {urgentRisk ? tr(`Riega ${urgentRisk.parcel.name}`, urgentRisk.parcel.name) : tr("Todo en orden hoy", "Sin acciones críticas")}
          </div>
          <p style={{ fontSize: fz.sm, color: th.soft, marginTop: 4, lineHeight: 1.5 }}>
            {urgentRisk
              ? tr(`Riégala de madrugada (~${cheapest}:00, tarifa baja) y ahorras ~$${fmt(nightlySaving)} esta noche.`, `Ventana óptima ${cheapest}:00 (tarifa baja) · ahorro ~$${fmt(nightlySaving)}.`)
              : tr(`Riega en la ventana barata (~${cheapest}:00) y ahorras ~$${fmt(nightlySaving)} esta noche.`, `Ventana óptima ${cheapest}:00 · ahorro ~$${fmt(nightlySaving)}.`)}
          </p>
          {urgentRisk && (
            <div style={{ marginTop: space.md, display: "inline-flex", alignItems: "center", gap: 8, fontSize: fz.xs, color: th.ink, background: `${riskColor}12`, border: `1px solid ${riskColor}33`, borderRadius: radius.md, padding: "7px 12px", lineHeight: 1.4 }}>
              <Icon name="drop" size={13} color={riskColor} />
              <span>
                {tr(`Si no riegas en ~${urgentRisk.hoursToCritical} h, pones en riesgo `, `Umbral crítico en ~${urgentRisk.hoursToCritical} h · cosecha en riesgo `)}
                <b className="mono" style={{ color: riskColor }}>${fmt(urgentRisk.projectedLoss)}</b>
                {tr(" de cosecha.", ".")}
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: space.sm, marginTop: space.lg, flexWrap: "wrap" }}>
            <button onClick={programar} disabled={done} style={{ border: "none", background: done ? C.emerald : C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: done ? "default" : "pointer", transition: ".2s" }}>
              {done ? tr("Riego programado ✓", "Programado ✓") : tr("Programar riego", "Programar riego")}
            </button>
            {done ? (
              <button onClick={() => setView("riego")} style={{ background: th.panel2, border: `1px solid ${th.line}`, color: th.ink, borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer" }}>
                {tr("Ver en la bitácora", "Ver en bitácora")}
              </button>
            ) : urgentRisk ? (
              <button onClick={() => setView("mapa")} style={{ background: th.panel2, border: `1px solid ${th.line}`, color: th.ink, borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer" }}>
                {tr("Ver parcela", "Ver parcela")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Ahorro del mes (la recompensa, en degradado de marca) ── */}
      <div className="card" style={{ background: `linear-gradient(110deg,${C.brandNavy},${C.glacier} 60%,${C.emerald})`, borderRadius: radius.lg, padding: space.x2, marginBottom: space.md, position: "relative", overflow: "hidden", color: "#fff" }}>
        <p style={{ fontSize: fz.sm, color: "rgba(255,255,255,.85)", marginBottom: space.sm }}>{tr("Lo que llevas ahorrado este mes en luz y agua", "Ahorro operativo del mes · gasto de luz + agua")}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: space.md, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(28px, 9vw, 40px)" }}>${fmt(saved)}</span>
          <span style={{ fontSize: fz.md, color: "rgba(255,255,255,.9)" }}>{tr("vs. regar como antes, sin WaterSense", "frente a patrón histórico")}</span>
        </div>
        <span style={{ display: "inline-block", marginTop: space.md, fontSize: fz.xs, fontWeight: 600, background: "rgba(255,255,255,.2)", padding: "4px 11px", borderRadius: radius.pill }}>
          {totalHa > 0
            ? tr(`Estimado con tus ${fmt(totalHa)} ha y el precio de luz de hoy`, `Estimación · ${fmt(totalHa)} ha × diferencial tarifario CENACE`)
            : tr("Agrega tus parcelas para estimar tu ahorro", "Sin parcelas · agrega para estimar")}
        </span>
      </div>

      {/* ── Estado vacío: sin parcelas no hay rancho que auditar ── */}
      {parcels.length === 0 && (
        <div className="card" style={{ ...cardStyle(th), padding: space.x2, marginBottom: space.md, display: "flex", alignItems: "center", gap: space.lg, flexWrap: "wrap" }}>
          <span style={{ width: 42, height: 42, borderRadius: radius.lg, background: th.panel2, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="leaf" size={20} color={C.emerald} />
          </span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 600 }}>{tr("Empieza por tus parcelas", "Sin parcelas")}</div>
            <div style={{ fontSize: fz.sm, color: th.soft, marginTop: 2, lineHeight: 1.5 }}>
              {tr("Dibuja tus parcelas en el mapa para ver tu cosecha, tu energía y tu ahorro reales.", "Dibuja tus parcelas en el mapa para poblar cosecha, energía y ahorro.")}
            </div>
          </div>
          <button onClick={() => setView("mapa")} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
            {tr("Dibujar en el mapa", "Ir al mapa")}
          </button>
        </div>
      )}

      {/* ── Detalle analítico: colapsado en Simple, abierto en Técnico ── */}
      {parcels.length > 0 && (
      <>
      <button
        onClick={() => setShowDetail((s) => !s)}
        style={{ width: "100%", marginBottom: space.md, background: th.panel, border: `1px solid ${th.line}`, color: th.ink, borderRadius: radius.md, padding: "11px 16px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        {showDetail ? tr("Ocultar el detalle", "Ocultar detalle") : tr("Ver más: cosecha, energía y clima", "Ver detalle analítico")}
        <span style={{ transform: showDetail ? "rotate(-90deg)" : "rotate(90deg)", transition: ".2s", display: "inline-flex" }}>
          <Icon name="arrow" size={14} color={th.soft} />
        </span>
      </button>

      {showDetail && (
        <>

      {/* yield projection + what-if */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 340px),1fr))", gap: space.md, marginBottom: space.md }}>
        {/* yield = irrigation as investment */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 600 }}>{tr("Cosecha proyectada", "Proyección de rendimiento")}</div>
            <span className="mono" style={{ fontSize: fz.xs, color: harvest.pct >= 80 ? C.emerald : harvest.pct >= 60 ? C.alert : C.critical }}>{harvest.pct}% {tr("del potencial", "del potencial")}</span>
          </div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Lo que vale tu cosecha (valor de producción, no es ahorro)", "Valor estimado de la producción según riego")}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: space.sm }}>
            <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: th.ink }}>${fmt(harvest.revenue)}</span>
            <span style={{ fontSize: fz.xs, color: th.soft }}>{tr("ingreso estimado", "ingreso proyectado")}</span>
          </div>
          {/* potential bar */}
          <div style={{ height: 7, borderRadius: 4, background: th.panel2, overflow: "hidden", margin: `${space.md}px 0 ${space.sm}px` }}>
            <div style={{ height: "100%", width: `${harvest.pct}%`, background: C.emerald, borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: fz.xs, color: th.soft }}>
            {tr("Valor de cosecha en riesgo por sed: ", "Merma por estrés hídrico: ")}
            <b className="mono" style={{ color: C.alert }}>${fmt(harvest.lost)}</b>
            {tr(" — recuperable si riegas a tiempo.", " (recuperable con mejor riego).")}
          </div>
        </div>

        {/* what-if: irrigation hour → live savings */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 600 }}>{tr("¿Y si riego a otra hora?", "Simulación de horario")}</div>
            <span className="mono" style={{ fontSize: fz.xs, color: th.mute }}>{waterHour}:00</span>
          </div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Mueve la hora y mira cuánto ahorras al mes", "Ahorro mensual estimado según la hora de bombeo")}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: space.sm }}>
            <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: whatIfSaved > 0 ? C.emerald : th.mute }}>${fmt(whatIfSaved)}</span>
            <span style={{ fontSize: fz.xs, color: th.soft }}>{tr("ahorro/mes vs. la hora más cara", "vs. hora pico")}</span>
          </div>
          <input type="range" min={0} max={23} value={waterHour} onChange={(e) => setWaterHour(+e.target.value)} style={{ width: "100%", accentColor: waterHour === cheapest ? C.emerald : C.glacier, cursor: "pointer", margin: `${space.md}px 0 4px` }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: fz.micro, color: th.mute }}>
            <span>0:00</span>
            <span>{waterHour === cheapest ? <b style={{ color: C.emerald }}>{tr("¡hora más barata!", "óptimo")}</b> : <button onClick={() => setWaterHour(cheapest)} style={{ background: "none", border: "none", color: C.glacier, cursor: "pointer", fontSize: fz.micro, padding: 0 }}>{tr(`ir a la más barata (${cheapest}:00)`, `óptimo ${cheapest}:00`)}</button>}</span>
            <span>23:00</span>
          </div>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 340px),1fr))", gap: space.md }}>
        {/* weather + rain impact */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("El clima y tu riego", "Pronóstico · impacto en riego")}</div>
            {liveForecast && (
              <span style={{ fontSize: fz.micro, color: C.emerald, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.emerald }} />
                {tr("clima real", "Open-Meteo")}
              </span>
            )}
          </div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.lg }}>{tr("Delicias · próximos 5 días", "Delicias, Chihuahua · 5 días")}</div>

          {today && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.lg, padding: `${space.md}px ${space.lg}px`, borderRadius: radius.md, background: today.rainMm >= 3 ? `${C.glacier}12` : th.panel2, border: `1px solid ${today.rainMm >= 3 ? C.glacier + "44" : th.line}`, marginBottom: space.md }}>
              <div style={{ display: "flex", alignItems: "center", gap: space.lg }}>
                <Icon name={today.icon} size={46} color={today.rainMm >= 3 ? C.glacier : C.alert} />
                <div>
                  <div style={{ ...labelStyle(th) }}>{tr("Hoy", "Hoy")}</div>
                  <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: 40, lineHeight: 1.05 }}>{today.tempMax}°</div>
                  <div style={{ fontSize: fz.xs, color: th.soft, marginTop: 2 }}>{condition(today)} · {tr("máxima", "máx")}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {today.rainMm > 0 ? (
                  <div className="mono" style={{ fontSize: fz.md, fontWeight: 700, color: C.glacier }}>{today.rainMm} mm</div>
                ) : (
                  <div style={{ fontSize: fz.xs, color: th.mute }}>{tr("sin lluvia", "0 mm")}</div>
                )}
                <div style={{ fontSize: fz.micro, color: th.mute, marginTop: 4 }}>Delicias, Chih.</div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(restDays.length, 1)}, 1fr)`, gap: space.sm, marginBottom: space.md }}>
            {restDays.map((f, i) => (
              <div key={i} style={{ textAlign: "center", padding: "12px 4px", borderRadius: radius.md, background: f.rainMm >= 3 ? `${C.glacier}14` : th.panel2, border: `1px solid ${f.rainMm >= 3 ? C.glacier + "44" : th.line}` }}>
                <div style={{ fontSize: fz.micro, color: th.mute, marginBottom: 7 }}>{f.day}</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
                  <Icon name={f.icon} size={20} color={f.rainMm >= 3 ? C.glacier : th.soft} />
                </div>
                <div className="mono" style={{ fontSize: fz.sm, fontWeight: 600 }}>{f.tempMax}°</div>
                {f.rainMm > 0 ? (
                  <div className="mono" style={{ fontSize: 10, color: C.glacier, marginTop: 2 }}>{f.rainMm}mm</div>
                ) : (
                  <div style={{ fontSize: 10, color: th.mute, marginTop: 2 }}>—</div>
                )}
              </div>
            ))}
          </div>

          {/* insight — always present, fills the card */}
          <div style={{ marginTop: "auto", padding: `${space.md}px ${space.md}px`, borderRadius: radius.md, background: rainDay ? `${C.emerald}12` : `${C.alert}10`, border: `1px solid ${rainDay ? C.emerald + "33" : C.alert + "30"}`, fontSize: fz.sm, color: th.ink, display: "flex", alignItems: "center", gap: 9, lineHeight: 1.5 }}>
            <Icon name={rainDay ? "leaf" : "sun"} size={15} color={rainDay ? C.emerald : C.alert} />
            {rainDay
              ? tr(
                  `Lloverá el ${rainDay.day.toLowerCase()} (${rainDay.rainMm}mm). Cubre el riego de ${parcels.length} ${parcels.length === 1 ? "parcela" : "parcelas"} — pausamos y ahorras ~$${fmt(nightlySaving)}.`,
                  `Precipitación ${rainDay.rainMm}mm el ${rainDay.day}. Riego pausado en ${parcels.length} ${parcels.length === 1 ? "zona" : "zonas"} · ahorro estimado $${fmt(nightlySaving)}.`
                )
              : tr(
                  `Semana seca y calurosa (hasta ${maxTemp}°). Conviene regar de madrugada para perder menos agua por evaporación.`,
                  `Sin precipitación · máx ${maxTemp}°. Prioriza riego nocturno para reducir pérdidas por evapotranspiración.`
                )}
          </div>
        </div>

        {/* next actions */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Qué hará WaterSense por ti", "Próximas acciones automáticas")}</div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Sin que muevas un dedo", "Programado por el motor")}</div>
          {actions.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: space.md, padding: "11px 0", borderBottom: i < actions.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: TONE[a.tone], flexShrink: 0 }} />
              <span style={{ fontSize: fz.sm, color: th.ink }}>{a.text}</span>
              <span className="mono" style={{ marginLeft: "auto", fontSize: fz.xs, color: th.mute }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
      </>
      )}
    </div>
  );
}
