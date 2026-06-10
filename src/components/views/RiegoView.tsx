"use client";

// ============================================================
// WaterSense — Bitácora de riego
// Cierra el círculo "qué regué → qué me costó → cuánto me queda de
// concesión". Pensada para Chihuahua: el agua se mide contra tu volumen
// concesionado (REPDA); pasarte = sanción de CONAGUA. Por eso el control
// de concesión es la cabecera de esta vista.
//
// Captura por horas de bombeo o por m³ (se convierte con el caudal del
// pozo). Estima energía ($ CENACE) y derechos de agua (cuota CONAGUA).
// Persistencia local (como el resto del PoC).
// ============================================================

import { useEffect, useMemo, useState } from "react";
import type { Parcel, Well, RanchConfig } from "@/types/domain";
import { C, cardStyle, fmt, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";

interface Riego {
  id: string;
  parcelId: string;
  wellId: string;
  date: string; // yyyy-mm-dd
  hours: number;
  m3: number;
  hour: number; // hora de bombeo (precio CENACE)
  kwh: number;
  energyCost: number;
  waterCost: number;
}

// Energía por m³ bombeado (~80 m de elevación) y cuota de agua por m³
// (derechos CONAGUA, uso agrícola). Con datos reales se calculan del pozo
// y de tu título de concesión.
const KWH_PER_M3 = 0.55;
const WATER_RATE = 0.25; // $/m³ (derechos CONAGUA, representativo)

function dayOfYear(d = new Date()) {
  return Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000);
}

export function RiegoView({ th, tr, parcels, wells, tariffCurve, ranch }: { th: Theme; tr: (s: string, t: string) => string; parcels: Parcel[]; wells: Well[]; tariffCurve: number[]; ranch: RanchConfig }) {
  const [riegos, setRiegos] = useState<Riego[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("watersense.riegos");
      if (raw) setRiegos(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.riegos", JSON.stringify(riegos));
    } catch {
      /* ignore */
    }
  }, [riegos]);

  const cheapest = useMemo(() => (tariffCurve.length ? tariffCurve.indexOf(Math.min(...tariffCurve)) : 2), [tariffCurve]);
  const [parcelId, setParcelId] = useState(parcels[0]?.id ?? "");
  const [wellId, setWellId] = useState(wells[0]?.id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<"hours" | "m3">("hours");
  const [val, setVal] = useState("");
  const [hour, setHour] = useState(cheapest);
  useEffect(() => { if (!parcelId && parcels[0]) setParcelId(parcels[0].id); }, [parcels, parcelId]);
  useEffect(() => { if (!wellId && wells[0]) setWellId(wells[0].id); }, [wells, wellId]);
  useEffect(() => setHour(cheapest), [cheapest]);

  const wellFlow = wells.find((w) => w.id === wellId)?.currentFlowLph ?? 6000; // L/h

  const compute = (raw: number, m: "hours" | "m3", h: number) => {
    const hours = m === "hours" ? raw : wellFlow > 0 ? raw / (wellFlow / 1000) : 0;
    const m3 = m === "m3" ? raw : (raw * wellFlow) / 1000;
    const kwh = Math.round(m3 * KWH_PER_M3);
    const energyCost = Math.round(kwh * (tariffCurve[h] ?? 1.5));
    const waterCost = Math.round(m3 * WATER_RATE);
    return { hours: Math.round(hours * 10) / 10, m3: Math.round(m3), kwh, energyCost, waterCost };
  };
  const live = compute(parseFloat(val) || 0, mode, hour);

  const add = () => {
    const raw = parseFloat(val) || 0;
    if (!parcelId || !wellId || raw <= 0) return;
    const c = compute(raw, mode, hour);
    setRiegos((prev) => [{ id: `riego-${Date.now()}`, parcelId, wellId, date, hour, ...c }, ...prev]);
    setVal("");
  };
  const remove = (id: string) => setRiegos((prev) => prev.filter((r) => r.id !== id));
  const parcelName = (id: string) => parcels.find((p) => p.id === id)?.name ?? tr("Parcela", "Parcela");

  // ── Resumen del mes ──
  const monthKey = new Date().toISOString().slice(0, 7);
  const month = riegos.filter((r) => r.date.slice(0, 7) === monthKey);
  const totM3 = month.reduce((s, r) => s + r.m3, 0);
  const totEnergy = month.reduce((s, r) => s + r.energyCost, 0);
  const totWater = month.reduce((s, r) => s + r.waterCost, 0);
  const costPerM3 = totM3 > 0 ? (totEnergy + totWater) / totM3 : 0;

  // ── Concesión (el control que importa en Chihuahua) ──
  const yearKey = new Date().getFullYear().toString();
  const extractedYear = riegos.filter((r) => r.date.slice(0, 4) === yearKey).reduce((s, r) => s + r.m3, 0);
  const concession = ranch.concessionM3Year ?? 0;
  const pctUsed = concession > 0 ? extractedYear / concession : 0;
  const projectedYear = Math.round((extractedYear / Math.max(1, dayOfYear())) * 365);
  const concColor = pctUsed >= 0.9 ? C.critical : pctUsed >= 0.7 ? C.alert : C.emerald;

  const inputStyle: React.CSSProperties = { background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "9px 11px", color: th.ink, fontSize: fz.sm, outline: "none" };

  return (
    <div style={{ padding: space.x3 }}>
      <div style={{ fontSize: fz.sm, color: th.mute, maxWidth: 660, marginBottom: space.lg }}>
        {tr(
          "Apunta cada riego: qué parcela, qué pozo, cuánto bombeaste y cuándo. WaterSense estima la energía, los derechos de agua y cuánto llevas de tu concesión del año.",
          "Registro de extracciones · energía (CENACE) + derechos (CONAGUA) + control de concesión. Local."
        )}
      </div>

      {/* Concesión — la cabecera que importa en Chihuahua */}
      {concession > 0 && (
        <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginBottom: space.md, borderLeft: `4px solid ${concColor}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: space.sm, marginBottom: space.sm }}>
            <div style={{ fontWeight: 600 }}>{tr("Tu concesión este año", "Concesión · uso anual")}</div>
            <span className="mono" style={{ fontSize: fz.xs, color: th.mute }}>{ranch.concessionTitle || tr("título REPDA", "REPDA")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: space.sm, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontFamily: "var(--font-montserrat)", fontWeight: 700, fontSize: fz.hero, color: concColor }}>{Math.round(pctUsed * 100)}%</span>
            <span style={{ fontSize: fz.sm, color: th.soft }}>{tr(`usado · ${fmt(extractedYear)} de ${fmt(concession)} m³`, `${fmt(extractedYear)} / ${fmt(concession)} m³`)}</span>
          </div>
          <div style={{ height: 9, borderRadius: 5, background: th.panel2, overflow: "hidden", margin: `${space.md}px 0 ${space.sm}px` }}>
            <div style={{ height: "100%", width: `${Math.min(100, pctUsed * 100)}%`, background: concColor, borderRadius: 5, transition: "width .4s" }} />
          </div>
          <div style={{ fontSize: fz.xs, color: th.soft, lineHeight: 1.5 }}>
            {extractedYear === 0
              ? tr("Aún no registras extracción este año. Cada riego que apuntes descuenta de tu concesión.", "Sin extracción registrada este año.")
              : projectedYear > concession
              ? <>⚠️ {tr(`A este ritmo terminarías el año en ~${fmt(projectedYear)} m³ — por encima de tu concesión. Riesgo de sanción de CONAGUA.`, `Proyección anual ~${fmt(projectedYear)} m³ > concesión.`)}</>
              : tr(`A este ritmo cerrarías el año en ~${fmt(projectedYear)} m³, dentro de tu concesión.`, `Proyección anual ~${fmt(projectedYear)} m³ · dentro de la concesión.`)}
          </div>
        </div>
      )}

      {/* Resumen del mes */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginBottom: space.md }}>
        <div style={{ ...labelStyle(th), marginBottom: space.md }}>{tr("Este mes", "Mes en curso")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 140px),1fr))", gap: space.md }}>
          {[
            { l: tr("Agua regada", "Volumen"), v: `${fmt(totM3)} m³`, c: C.glacier },
            { l: tr("Energía (luz)", "Energía $"), v: `$${fmt(totEnergy)}`, c: th.ink },
            { l: tr("Agua (derechos)", "Derechos $"), v: `$${fmt(totWater)}`, c: th.ink },
            { l: tr("Costo por m³", "$/m³"), v: `$${costPerM3.toFixed(2)}`, c: C.emerald },
            { l: tr("Riegos", "Eventos"), v: `${month.length}`, c: th.ink },
          ].map((m) => (
            <div key={m.l}>
              <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: 4 }}>{m.l}</div>
              <div className="mono" style={{ fontSize: fz.xl, fontWeight: 700, color: m.c }}>{m.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Registrar un riego */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginBottom: space.md }}>
        <div style={{ fontWeight: 600, marginBottom: space.md }}>{tr("Registrar un riego", "Nueva extracción")}</div>
        <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ fontSize: fz.xs, color: th.soft }}>
            <div style={{ marginBottom: 4 }}>{tr("Parcela", "Parcela")}</div>
            <select value={parcelId} onChange={(e) => setParcelId(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}>
              {parcels.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </label>
          <label style={{ fontSize: fz.xs, color: th.soft }}>
            <div style={{ marginBottom: 4 }}>{tr("Pozo", "Pozo")}</div>
            <select value={wellId} onChange={(e) => setWellId(e.target.value)} style={{ ...inputStyle, minWidth: 130 }}>
              {wells.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
            </select>
          </label>
          <label style={{ fontSize: fz.xs, color: th.soft }}>
            <div style={{ marginBottom: 4 }}>{tr("Fecha", "Fecha")}</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </label>
          {/* modo horas / m³ */}
          <div>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              {(["hours", "m3"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} style={{ fontSize: fz.micro, fontWeight: 600, padding: "3px 9px", borderRadius: radius.pill, cursor: "pointer", border: `1px solid ${mode === m ? C.glacier : th.line}`, background: mode === m ? `${C.glacier}14` : th.panel2, color: mode === m ? th.ink : th.soft }}>
                  {m === "hours" ? tr("Horas de bombeo", "Horas") : tr("Metros cúbicos", "m³")}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, paddingRight: 9 }}>
              <input type="number" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="0" style={{ ...inputStyle, border: "none", background: "transparent", width: 90 }} />
              <span style={{ fontSize: fz.xs, color: th.mute }}>{mode === "hours" ? "h" : "m³"}</span>
            </div>
          </div>
          <label style={{ fontSize: fz.xs, color: th.soft }}>
            <div style={{ marginBottom: 4 }}>{tr("Hora", "Hora")} {hour === cheapest && <span style={{ color: C.emerald }}>· {tr("barata", "óptima")}</span>}</div>
            <input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Math.max(0, Math.min(23, +e.target.value)))} style={{ ...inputStyle, width: 70 }} />
          </label>
          <button onClick={add} disabled={!parseFloat(val)} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: parseFloat(val) ? "pointer" : "default", opacity: parseFloat(val) ? 1 : 0.5 }}>
            {tr("Registrar", "Guardar")}
          </button>
        </div>
        {parseFloat(val) > 0 && (
          <div style={{ marginTop: space.md, fontSize: fz.xs, color: th.soft, display: "flex", gap: space.lg, flexWrap: "wrap" }}>
            <span><b className="mono" style={{ color: C.glacier }}>{fmt(live.m3)} m³</b> {mode === "hours" ? tr("bombeados", "bombeados") : `· ${live.hours} h`}</span>
            <span><b className="mono" style={{ color: th.ink }}>{fmt(live.kwh)} kWh</b></span>
            <span>{tr("Energía", "Energía")} <b className="mono" style={{ color: C.emerald }}>${fmt(live.energyCost)}</b></span>
            <span>{tr("Agua", "Agua")} <b className="mono" style={{ color: th.ink }}>${fmt(live.waterCost)}</b></span>
            <span>{tr("Total", "Total")} <b className="mono" style={{ color: th.ink }}>${fmt(live.energyCost + live.waterCost)}</b></span>
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="card" style={{ ...cardStyle(th), overflow: "hidden" }}>
        <div style={{ padding: `${space.lg}px ${space.xl}px`, borderBottom: `1px solid ${th.line}`, fontWeight: 600 }}>{tr("Riegos registrados", "Historial de extracciones")}</div>
        {riegos.length === 0 ? (
          <div style={{ padding: `${space.x2}px ${space.xl}px`, textAlign: "center", color: th.soft }}>
            <span style={{ width: 44, height: 44, borderRadius: radius.lg, background: th.panel2, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: space.md }}>
              <Icon name="drop" size={22} color={th.mute} />
            </span>
            <div style={{ fontSize: fz.sm }}>{tr("Aún no registras riegos. Apunta el primero arriba.", "Sin registros.")}</div>
          </div>
        ) : (
          riegos.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: space.md, padding: `${space.md}px ${space.xl}px`, borderBottom: i < riegos.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <span style={{ width: 32, height: 32, borderRadius: radius.md, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="drop" size={15} color={C.glacier} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: fz.sm, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{parcelName(r.parcelId)}</div>
                <div style={{ fontSize: fz.xs, color: th.mute }}>{new Date(`${r.date}T12:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} · {r.hours}h · {r.hour}:00</div>
              </div>
              <div style={{ display: "flex", gap: space.lg, alignItems: "baseline", flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: fz.sm, fontWeight: 600 }}>{fmt(r.m3)} m³</div>
                  <div style={{ fontSize: fz.micro, color: th.mute }}>{fmt(r.kwh)} kWh</div>
                </div>
                <div className="mono" style={{ fontSize: fz.md, fontWeight: 700, color: C.emerald, minWidth: 70, textAlign: "right" }}>${fmt(r.energyCost + r.waterCost)}</div>
                <button onClick={() => remove(r.id)} aria-label={tr("Eliminar", "Eliminar")} title={tr("Eliminar", "Eliminar")} style={{ background: "none", border: "none", cursor: "pointer", color: th.mute, fontSize: 15, padding: 2 }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
