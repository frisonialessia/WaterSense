"use client";

// ============================================================
// WaterSense — Bitácora de riego
// Cierra el círculo "qué regué → qué me costó": registra cada riego
// (parcela, fecha, m³, hora) y estima la energía y el $ de bombeo.
// Persistencia local (como el resto del PoC). Con datos reales, cada
// riego cruzaría con la tarifa CENACE real y el caudal medido del pozo.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import type { Parcel } from "@/types/domain";
import { C, cardStyle, fmt, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";

interface Riego {
  id: string;
  parcelId: string;
  date: string; // yyyy-mm-dd
  m3: number;
  hour: number;
  kwh: number;
  cost: number;
}

// Energía representativa por m³ bombeado (~80 m de elevación). Con datos
// reales se calcula de la profundidad del pozo y la eficiencia de la bomba.
const KWH_PER_M3 = 0.55;

export function RiegoView({ th, tr, parcels, tariffCurve }: { th: Theme; tr: (s: string, t: string) => string; parcels: Parcel[]; tariffCurve: number[] }) {
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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [m3, setM3] = useState("");
  const [hour, setHour] = useState(cheapest);
  useEffect(() => {
    if (!parcelId && parcels[0]) setParcelId(parcels[0].id);
  }, [parcels, parcelId]);
  useEffect(() => setHour(cheapest), [cheapest]);

  const estimate = (vol: number, h: number) => {
    const kwh = Math.round(vol * KWH_PER_M3);
    const price = tariffCurve[h] ?? 1.5;
    return { kwh, cost: Math.round(kwh * price) };
  };
  const live = estimate(Math.round(parseFloat(m3) || 0), hour);

  const add = () => {
    const vol = Math.round(parseFloat(m3) || 0);
    if (!parcelId || vol <= 0) return;
    const { kwh, cost } = estimate(vol, hour);
    setRiegos((prev) => [{ id: `riego-${Date.now()}`, parcelId, date, m3: vol, hour, kwh, cost }, ...prev]);
    setM3("");
  };
  const remove = (id: string) => setRiegos((prev) => prev.filter((r) => r.id !== id));
  const parcelName = (id: string) => parcels.find((p) => p.id === id)?.name ?? tr("Parcela", "Parcela");

  // Resumen del mes en curso
  const monthKey = new Date().toISOString().slice(0, 7);
  const month = riegos.filter((r) => r.date.slice(0, 7) === monthKey);
  const totM3 = month.reduce((s, r) => s + r.m3, 0);
  const totCost = month.reduce((s, r) => s + r.cost, 0);
  const costPerM3 = totM3 > 0 ? totCost / totM3 : 0;

  const inputStyle: React.CSSProperties = { background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "9px 11px", color: th.ink, fontSize: fz.sm, outline: "none" };

  return (
    <div style={{ padding: space.x3 }}>
      <div style={{ fontSize: fz.sm, color: th.mute, maxWidth: 640, marginBottom: space.lg }}>
        {tr(
          "Apunta cada riego: qué parcela, cuándo y cuánta agua. WaterSense estima la energía y el costo de bombeo, para que veas qué regaste y qué pagaste.",
          "Registro de riegos · estima kWh y $ de bombeo por evento. Local (sin nube)."
        )}
      </div>

      {/* Resumen del mes */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginBottom: space.md }}>
        <div style={{ ...labelStyle(th), marginBottom: space.md }}>{tr("Este mes", "Mes en curso")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 150px),1fr))", gap: space.md }}>
          {[
            { l: tr("Agua regada", "Volumen"), v: `${fmt(totM3)} m³`, c: C.glacier },
            { l: tr("Costo de energía", "Energía $"), v: `$${fmt(totCost)}`, c: th.ink },
            { l: tr("Costo por m³", "$/m³"), v: `$${costPerM3.toFixed(2)}`, c: C.emerald },
            { l: tr("Riegos", "Eventos"), v: `${month.length}`, c: th.ink },
          ].map((mtr) => (
            <div key={mtr.l}>
              <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: 4 }}>{mtr.l}</div>
              <div className="mono" style={{ fontSize: fz.xl, fontWeight: 700, color: mtr.c }}>{mtr.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Registrar un riego */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginBottom: space.md }}>
        <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Registrar un riego", "Nuevo riego")}</div>
        <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>
          {tr("La hora barata baja el costo de bombeo.", "La hora define el precio CENACE aplicado.")}
        </div>
        <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ fontSize: fz.xs, color: th.soft }}>
            <div style={{ marginBottom: 4 }}>{tr("Parcela", "Parcela")}</div>
            <select value={parcelId} onChange={(e) => setParcelId(e.target.value)} style={{ ...inputStyle, minWidth: 170 }}>
              {parcels.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </label>
          <label style={{ fontSize: fz.xs, color: th.soft }}>
            <div style={{ marginBottom: 4 }}>{tr("Fecha", "Fecha")}</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ fontSize: fz.xs, color: th.soft }}>
            <div style={{ marginBottom: 4 }}>{tr("Agua (m³)", "m³")}</div>
            <input type="number" value={m3} onChange={(e) => setM3(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="0" style={{ ...inputStyle, width: 110 }} />
          </label>
          <label style={{ fontSize: fz.xs, color: th.soft }}>
            <div style={{ marginBottom: 4 }}>{tr("Hora", "Hora")} {hour === cheapest && <span style={{ color: C.emerald }}>· {tr("barata", "óptima")}</span>}</div>
            <input type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Math.max(0, Math.min(23, +e.target.value)))} style={{ ...inputStyle, width: 80 }} />
          </label>
          <button onClick={add} disabled={!parseFloat(m3)} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: parseFloat(m3) ? "pointer" : "default", opacity: parseFloat(m3) ? 1 : 0.5 }}>
            {tr("Registrar", "Guardar")}
          </button>
        </div>
        {parseFloat(m3) > 0 && (
          <div style={{ marginTop: space.md, fontSize: fz.xs, color: th.soft }}>
            {tr("Estimado:", "Estimado:")} <b className="mono" style={{ color: th.ink }}>{fmt(live.kwh)} kWh</b> · <b className="mono" style={{ color: C.emerald }}>${fmt(live.cost)}</b> {tr("de energía", "energía")}
          </div>
        )}
      </div>

      {/* Lista de riegos */}
      <div className="card" style={{ ...cardStyle(th), overflow: "hidden" }}>
        <div style={{ padding: `${space.lg}px ${space.xl}px`, borderBottom: `1px solid ${th.line}`, fontWeight: 600 }}>{tr("Riegos registrados", "Historial de riegos")}</div>
        {riegos.length === 0 ? (
          <div style={{ padding: `${space.x2}px ${space.xl}px`, textAlign: "center", color: th.soft }}>
            <span style={{ width: 44, height: 44, borderRadius: radius.lg, background: th.panel2, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: space.md }}>
              <Icon name="drop" size={22} color={th.mute} />
            </span>
            <div style={{ fontSize: fz.sm }}>{tr("Aún no registras riegos. Apunta el primero arriba.", "Sin riegos registrados.")}</div>
          </div>
        ) : (
          riegos.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: space.md, padding: `${space.md}px ${space.xl}px`, borderBottom: i < riegos.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <span style={{ width: 32, height: 32, borderRadius: radius.md, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="drop" size={15} color={C.glacier} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: fz.sm, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{parcelName(r.parcelId)}</div>
                <div style={{ fontSize: fz.xs, color: th.mute }}>{new Date(`${r.date}T12:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} · {r.hour}:00</div>
              </div>
              <div style={{ display: "flex", gap: space.lg, alignItems: "baseline", flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: fz.sm, fontWeight: 600 }}>{fmt(r.m3)} m³</div>
                  <div style={{ fontSize: fz.micro, color: th.mute }}>{fmt(r.kwh)} kWh</div>
                </div>
                <div className="mono" style={{ fontSize: fz.md, fontWeight: 700, color: C.emerald, minWidth: 64, textAlign: "right" }}>${fmt(r.cost)}</div>
                <button onClick={() => remove(r.id)} aria-label={tr("Eliminar", "Eliminar")} title={tr("Eliminar", "Eliminar")} style={{ background: "none", border: "none", cursor: "pointer", color: th.mute, fontSize: 15, padding: 2 }}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
