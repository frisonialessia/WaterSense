"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Parcel, WeatherDay, ScheduledAction, SavingsSummary, CropProfile, CropType, TariffType } from "@/types/domain";
import { projectYield } from "@/lib/brain/yieldModel";
import { assessStressRisk } from "@/lib/brain/stressRisk";
import { tariffSavingsFactor } from "@/lib/brain/irrigationFactors";
import { marketOutlook } from "@/lib/brain/marketModel";
import { C, FONT, cardStyle, fmt, space, fz, radius, labelStyle, stressColor, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";
import { Sparkline } from "../Sparkline";
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
  const saved = useCount(savings.amountThisMonth);
  const [done, setDone] = useState(false);
  const healthy = parcels.filter((p) => p.stress < 0.5).length;

  // Real Chihuahua weather via Open-Meteo (free, no key). Falls back to the
  // simulated forecast if the call fails (offline / blocked).
  const [liveForecast, setLiveForecast] = useState<WeatherDay[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,precipitation_sum&forecast_days=5&timezone=auto`)
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

  // ── Mercado: cuándo vender el cultivo principal ─────────────
  const market = useMemo(() => {
    const rev: Partial<Record<CropType, number>> = {};
    for (const p of parcels) {
      const c = cropMap[p.crop];
      if (!c) continue;
      const y = projectYield({ yieldKgHa: c.yieldKgHa, hectares: p.hectares, stress: p.stress, pricePerKg: c.pricePerKg });
      rev[p.crop] = (rev[p.crop] ?? 0) + y.revenue;
    }
    let dominant: CropType | null = null;
    let best = -1;
    for (const k of Object.keys(rev) as CropType[]) {
      const v = rev[k] ?? 0;
      if (v > best) {
        best = v;
        dominant = k;
      }
    }
    const profile = dominant ? cropMap[dominant] : undefined;
    if (!dominant || !profile) return null;
    return { crop: dominant, ...marketOutlook(profile.pricePerKg, dominant, new Date().getMonth()) };
  }, [parcels, cropMap]);
  const bestMonthName = market ? new Date(new Date().getFullYear(), new Date().getMonth() + market.bestMonthOffset, 1).toLocaleDateString("es-MX", { month: "long" }) : "";

  // ── Punto de no retorno (most-stressed parcel) ─────────────
  const risk = useMemo(() => {
    const driest = [...parcels].sort((a, b) => b.stress - a.stress)[0];
    const c = driest ? cropMap[driest.crop] : undefined;
    if (!driest || !c) return null;
    const r = assessStressRisk({ stress: driest.stress, hectares: driest.hectares, yieldKgHa: c.yieldKgHa, pricePerKg: c.pricePerKg });
    return { ...r, parcel: driest };
  }, [parcels, cropMap]);
  const riskColor = risk ? stressColor(risk.parcel.stress) : C.alert;

  // ── What-if: hora de riego → ahorro en vivo ────────────────
  const cheapest = useMemo(() => (tariffCurve.length ? tariffCurve.indexOf(Math.min(...tariffCurve)) : 2), [tariffCurve]);
  const peakPrice = useMemo(() => (tariffCurve.length ? Math.max(...tariffCurve) : 2.6), [tariffCurve]);
  const [waterHour, setWaterHour] = useState(cheapest);
  useEffect(() => setWaterHour(cheapest), [cheapest]);
  const monthlyKwh = 9000; // representative monthly pumping energy
  const priceAt = tariffCurve[waterHour] ?? 1.8;
  const whatIfSaved = Math.max(0, Math.round((peakPrice - priceAt) * monthlyKwh * tariffSavingsFactor(tariffType)));

  const cards = [
    { l: tr("Hoy debes regar", "Acción prioritaria"), v: risk?.parcel.name ?? tr("Parcela del chile", "Parcela chile"), s: tr("a las 2am · ahorras $90", "tarifa baja · 02:00"), c: C.alert, action: done ? tr("Riego programado ✓", "Programado ✓") : tr("Programar riego", "Programar"), onAct: () => setDone(true), solid: !done },
    { l: tr("Tus cultivos", "Salud general"), v: `${healthy} ${tr("sanos", "OK")}`, s: `${parcels.length} ${tr("parcelas", "zonas")}`, c: C.emerald, action: tr("Ver mapa", "Ver mapa"), onAct: () => setView("mapa"), solid: false },
    { l: tr("Tus pozos", "Acuífero"), v: tr("1 en cuidado", "1 alerta"), s: tr("el pozo chico baja", "sobreexplotación"), c: C.glacier, action: tr("Revisar pozos", "Revisar"), onAct: () => setView("pozos"), solid: false },
  ];

  return (
    <div style={{ padding: space.x3 }}>
      {/* cover — the dashboard's one brand-gradient moment */}
      <div className="card" style={{ background: `linear-gradient(110deg,${C.brandNavy},${C.glacier} 60%,${C.emerald})`, borderRadius: radius.lg, padding: `${space.x2}px ${space.x2}px`, marginBottom: space.md, position: "relative", overflow: "hidden", color: "#fff" }}>
        <p style={{ fontSize: fz.sm, color: "rgba(255,255,255,.85)", marginBottom: space.sm }}>{tr("Lo que llevas ahorrado este mes", "Auditoría contrafactual")}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: space.md, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.hero }}>${fmt(saved)}</span>
          <span style={{ fontSize: fz.md, color: "rgba(255,255,255,.9)" }}>{tr("vs. regar como antes, sin WaterSense", "frente a patrón histórico")}</span>
        </div>
        <span style={{ display: "inline-block", marginTop: space.md, fontSize: fz.xs, fontWeight: 600, background: "rgba(255,255,255,.2)", padding: "4px 11px", borderRadius: radius.pill }}>
          ↑ +{savings.vsLastMonthPct}% {tr("que el mes pasado", "vs. mes anterior")}
        </span>
      </div>

      {/* point-of-no-return alert (the one alert element) */}
      {risk && risk.level !== "ok" && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: space.md, background: `${riskColor}12`, border: `1px solid ${riskColor}44`, borderRadius: radius.lg, padding: `${space.md}px ${space.lg}px`, marginBottom: space.md }}>
          <span style={{ width: 34, height: 34, borderRadius: radius.md, background: `${riskColor}1f`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="drop" size={18} color={riskColor} />
          </span>
          <div style={{ flex: 1, fontSize: fz.sm, color: th.ink, lineHeight: 1.5 }}>
            <b>{risk.parcel.name}</b>{" "}
            {tr(
              `alcanzará punto crítico de sed en ~${risk.hoursToCritical} h. Si no riegas, pérdida proyectada: `,
              `→ umbral crítico en ~${risk.hoursToCritical} h. Pérdida proyectada por inacción: `
            )}
            <b className="mono" style={{ color: riskColor }}>${fmt(risk.projectedLoss)}</b>.
          </div>
          <button onClick={() => setView("mapa")} style={{ border: "none", background: riskColor, color: "#fff", borderRadius: radius.md, padding: "8px 14px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
            {tr("Ver parcela", "Ver")}
          </button>
        </div>
      )}

      {/* action cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 240px),1fr))", gap: space.md, marginBottom: space.md }}>
        {cards.map((x, i) => (
          <div key={i} className="card" style={{ ...cardStyle(th), animationDelay: `${i * 0.06}s`, padding: space.xl, display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: fz.xs, color: th.mute, marginBottom: 6 }}>{x.l}</p>
            <p style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.xl, color: x.c }}>{x.v}</p>
            <p style={{ fontSize: fz.xs, color: th.soft, marginTop: 6, marginBottom: space.lg }}>{x.s}</p>
            <button onClick={x.onAct} style={{ marginTop: "auto", border: x.solid ? "none" : `1px solid ${th.line}`, background: x.solid ? C.glacier : th.panel2, color: x.solid ? "#fff" : th.ink, borderRadius: radius.md, padding: "9px 0", fontSize: fz.sm, fontWeight: 600, cursor: "pointer", transition: ".2s" }}>{x.action}</button>
          </div>
        ))}
      </div>

      {/* yield projection + what-if */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 340px),1fr))", gap: space.md, marginBottom: space.md }}>
        {/* yield = irrigation as investment */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 600 }}>{tr("Cosecha proyectada", "Proyección de rendimiento")}</div>
            <span className="mono" style={{ fontSize: fz.xs, color: harvest.pct >= 80 ? C.emerald : harvest.pct >= 60 ? C.alert : C.critical }}>{harvest.pct}% {tr("del potencial", "del potencial")}</span>
          </div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Si riegas bien, esto vale tu cosecha", "Valor estimado de la producción según riego")}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: space.sm }}>
            <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: th.ink }}>${fmt(harvest.revenue)}</span>
            <span style={{ fontSize: fz.xs, color: th.soft }}>{tr("ingreso estimado", "ingreso proyectado")}</span>
          </div>
          {/* potential bar */}
          <div style={{ height: 7, borderRadius: 4, background: th.panel2, overflow: "hidden", margin: `${space.md}px 0 ${space.sm}px` }}>
            <div style={{ height: "100%", width: `${harvest.pct}%`, background: C.emerald, borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: fz.xs, color: th.soft }}>
            {tr("Estás dejando de ganar ", "Merma por estrés hídrico: ")}
            <b className="mono" style={{ color: C.alert }}>${fmt(harvest.lost)}</b>
            {tr(" por sed de los cultivos.", " (recuperable con mejor riego).")}
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

        {/* market — when to sell */}
        {market && (
          <div className="card" style={{ ...cardStyle(th), padding: space.xl, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 600 }}>{tr("¿Cuándo vender?", "Mercado · venta")}</div>
              <span style={{ fontSize: fz.micro, fontWeight: 600, color: market.sellNow ? C.emerald : C.alert, background: `${market.sellNow ? C.emerald : C.alert}14`, border: `1px solid ${(market.sellNow ? C.emerald : C.alert)}33`, padding: "3px 9px", borderRadius: radius.pill }}>
                {market.sellNow ? tr("buen momento", "vender") : tr("conviene esperar", "esperar")}
              </span>
            </div>
            <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Precio de mercado", "Mercado")} · {market.crop}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: space.sm }}>
              <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: th.ink }}>${market.currentPrice.toFixed(2)}</span>
              <span style={{ fontSize: fz.xs, color: th.soft }}>$/kg {tr("hoy", "hoy")}</span>
              <span style={{ marginLeft: "auto", fontSize: fz.xs, fontWeight: 600, color: market.trend === "sube" ? C.emerald : market.trend === "baja" ? C.critical : th.mute }}>
                {market.trend === "sube" ? "↑" : market.trend === "baja" ? "↓" : "="} {market.trend}
              </span>
            </div>
            <div style={{ margin: `${space.md}px 0` }}>
              <Sparkline data={market.curve} color={C.glacier} width={240} height={36} />
            </div>
            <div style={{ marginTop: "auto", fontSize: fz.xs, color: th.ink, padding: `${space.sm}px ${space.md}px`, borderRadius: radius.md, background: `${C.glacier}10`, border: `1px solid ${C.glacier}25`, lineHeight: 1.5 }}>
              {market.sellNow
                ? tr(`El precio está cerca de su punto alto — buena ventana para vender.`, `Precio cerca del máximo del horizonte.`)
                : tr(`Mejor ventana: ${bestMonthName} (~$${market.bestMonthPrice.toFixed(2)}/kg). Si puedes almacenar, conviene esperar.`, `Pico proyectado: ${bestMonthName} · $${market.bestMonthPrice.toFixed(2)}/kg.`)}
            </div>
          </div>
        )}
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
                  `Lloverá el ${rainDay.day.toLowerCase()} (${rainDay.rainMm}mm). Cubre el riego de 2 parcelas — pausamos y ahorras ~$210.`,
                  `Precipitación ${rainDay.rainMm}mm el ${rainDay.day}. Riego pausado en 2 zonas · ahorro estimado $210.`
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
    </div>
  );
}
