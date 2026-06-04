"use client";

import { useEffect, useState } from "react";
import type { CostItem, Parcel } from "@/types/domain";
import { C, cardStyle, fmt, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";
import { HourlyPrices } from "./HourlyPrices";

interface DocEntry {
  id: string;
  category: string;
  amount: number;
  date: string;
  fileName?: string;
}

const CATEGORIES = [
  { id: "luz", label: "Luz (CFE)", icon: "bolt" },
  { id: "agua", label: "Agua / derechos", icon: "drop" },
  { id: "diesel", label: "Diésel", icon: "fuel" },
  { id: "mano", label: "Mano de obra", icon: "user" },
  { id: "mant", label: "Mantenimiento", icon: "wrench" },
  { id: "otro", label: "Otro", icon: "coin" },
];

const catOf = (id: string) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[5];

export function CostosView({ th, tr, costs, tariffCurve, parcels }: { th: Theme; tr: (s: string, t: string) => string; costs: CostItem[]; tariffCurve: number[]; parcels: Parcel[] }) {
  const total = costs.reduce((s, c) => s + c.month, 0);
  const [open, setOpen] = useState<string | null>("luz");

  // ── Documentos subidos por el usuario → historial (localStorage) ──
  const [history, setHistory] = useState<DocEntry[]>([]);
  const [cat, setCat] = useState("luz");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("watersense.docHistory");
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.docHistory", JSON.stringify(history));
    } catch {
      /* ignore */
    }
  }, [history]);

  const add = () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setHistory((h) => [{ id: `doc-${Date.now()}`, category: cat, amount: Math.round(n), date, fileName: fileName || undefined }, ...h]);
    setAmount("");
    setFileName("");
  };
  const remove = (id: string) => setHistory((h) => h.filter((e) => e.id !== id));

  const thisMonth = new Date().toISOString().slice(0, 7);
  const registeredThisMonth = history.filter((e) => e.date.slice(0, 7) === thisMonth).reduce((s, e) => s + e.amount, 0);

  const inputStyle: React.CSSProperties = { background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "8px 10px", color: th.ink, fontSize: fz.xs, outline: "none", fontFamily: "inherit" };

  return (
    <div style={{ padding: space.x3 }}>
      <div className="card" style={{ ...cardStyle(th), overflow: "hidden" }}>
        <div style={{ padding: `${space.lg}px ${space.xl}px`, borderBottom: `1px solid ${th.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{tr("Tus costos de este mes", "Costos operativos · mes")}</div>
            <div style={{ fontSize: fz.xs, color: th.mute, marginTop: 2 }}>{tr("Toca la luz para ver el detalle por hora", "Toca un rubro para desglose")}</div>
          </div>
          <span className="mono" style={{ fontSize: fz.xl, fontWeight: 700, color: th.ink }}>${fmt(total)}</span>
        </div>

        {costs.map((c, i) => {
          const expandable = c.id === "luz";
          const isOpen = open === c.id;
          return (
            <div key={c.id} style={{ borderBottom: i < costs.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <div onClick={() => expandable && setOpen(isOpen ? null : c.id)} style={{ padding: `${space.md}px ${space.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: expandable ? "pointer" : "default", background: isOpen ? th.panel2 : "transparent", transition: "background .2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: space.md }}>
                  <span style={{ width: 32, height: 32, borderRadius: radius.md, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={c.icon} size={16} color={c.id === "luz" ? C.alert : c.id === "agua" ? C.glacier : th.soft} />
                  </span>
                  <div>
                    <div style={{ fontSize: fz.sm, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      {c.label}
                      {expandable && <span style={{ fontSize: fz.micro, color: C.emerald, border: `1px solid ${C.emerald}55`, borderRadius: radius.sm, padding: "1px 6px" }}>{isOpen ? tr("ocultar", "ocultar") : tr("ver por hora", "detalle")}</span>}
                    </div>
                    <div style={{ fontSize: fz.xs, color: th.mute }}>{c.note}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: fz.md, fontWeight: 600 }}>${fmt(c.month)}</div>
                  <div style={{ fontSize: fz.xs, fontWeight: 600, color: c.trend < 0 ? C.emerald : c.trend > 0 ? C.critical : th.mute }}>
                    {c.trend > 0 ? "↑" : c.trend < 0 ? "↓" : "="} {Math.abs(c.trend)}%
                  </div>
                </div>
              </div>
              {expandable && isOpen && (
                <div style={{ background: th.panel2, borderTop: `1px solid ${th.line}` }}>
                  <HourlyPrices th={th} tr={tr} prices={tariffCurve} parcels={parcels} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* upload receipts → history */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginTop: space.md }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
          <div style={{ fontWeight: 600 }}>{tr("Sube tus recibos", "Registro de comprobantes")}</div>
          {registeredThisMonth > 0 && <span className="mono" style={{ fontSize: fz.xs, color: th.soft }}>{tr("este mes:", "mes:")} <b style={{ color: th.ink }}>${fmt(registeredThisMonth)}</b></span>}
        </div>
        <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>
          {tr("Sube la foto del recibo (luz, agua, diésel, mano…), pon el monto y se va a tu historial.", "Adjunta comprobante, captura monto y rubro; se agrega al historial.")}
        </div>

        <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", alignItems: "center", marginBottom: space.md }}>
          <select value={cat} onChange={(e) => setCat(e.target.value)} style={inputStyle} aria-label={tr("Rubro", "Rubro")}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <div style={{ display: "flex", alignItems: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, paddingLeft: 10 }}>
            <span style={{ color: th.mute, fontSize: fz.xs }}>$</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={tr("Monto", "Monto")} style={{ ...inputStyle, border: "none", background: "transparent", width: 110 }} />
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} aria-label={tr("Fecha", "Fecha")} />
          <label style={{ ...inputStyle, cursor: "pointer", color: th.soft, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="book" size={13} color={th.soft} />
            {fileName ? fileName.slice(0, 16) : tr("Adjuntar", "Archivo")}
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} style={{ display: "none" }} />
          </label>
          <button onClick={add} style={{ border: "none", background: C.emerald, color: "#fff", borderRadius: radius.md, padding: "8px 16px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>{tr("Agregar", "Agregar")}</button>
        </div>

        {history.length > 0 ? (
          <div>
            <div style={{ ...labelStyle(th), marginBottom: space.sm }}>{tr("Historial", "Historial")}</div>
            {history.map((e) => {
              const c = catOf(e.category);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: space.md, padding: "8px 0", borderBottom: `1px solid ${th.line}` }}>
                  <span style={{ width: 28, height: 28, borderRadius: radius.sm, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={c.icon} size={14} color={th.soft} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: fz.sm, color: th.ink }}>{c.label}</div>
                    <div className="mono" style={{ fontSize: fz.micro, color: th.mute }}>{e.date}{e.fileName ? ` · ${e.fileName}` : ""}</div>
                  </div>
                  <span className="mono" style={{ fontSize: fz.sm, fontWeight: 600 }}>${fmt(e.amount)}</span>
                  <button onClick={() => remove(e.id)} aria-label={tr("Borrar", "Borrar")} title={tr("Borrar", "Borrar")} style={{ background: "none", border: "none", cursor: "pointer", color: th.mute, fontSize: 13, padding: 2 }}>🗑</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: fz.xs, color: th.mute, fontStyle: "italic" }}>{tr("Aún no has subido comprobantes.", "Sin comprobantes registrados.")}</div>
        )}
      </div>

      <p style={{ fontSize: fz.xs, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
        {tr(
          "Cifras simuladas con rangos típicos de Chihuahua. Lo que subes se guarda solo en tu navegador (demo). Con datos reales (CFE, CONAGUA, CENACE) y una base de datos, tu historial sería permanente y por usuario.",
          "Datos simulados · rangos típicos región Delicias. El historial se guarda en localStorage (demo); pendiente integración CFE/CONAGUA/CENACE + persistencia."
        )}
      </p>
    </div>
  );
}
