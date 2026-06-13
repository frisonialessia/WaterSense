"use client";

// Reporte de extracción de agua para CONAGUA — generado desde la bitácora de
// riego (localStorage) y el título de concesión del rancho. Listo para imprimir
// o guardar como PDF (window.print()). En la demo los datos son simulados.
import { useEffect, useState } from "react";
import Link from "next/link";
import type { RanchConfig } from "@/types/domain";
import { T, C, FONT, space, fz, radius } from "@/lib/theme";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

const th = T.light;

interface Riego {
  parcelName?: string;
  wellName?: string;
  date: string;
  hours?: number;
  m3: number;
  kwh: number;
  energyCost: number;
  waterCost: number;
}

const FALLBACK: Pick<RanchConfig, "name" | "owner" | "concessionM3Year" | "concessionTitle"> = {
  name: "Rancho de ejemplo",
  owner: "",
  concessionM3Year: 320000,
  concessionTitle: "",
};

export default function ReporteConaguaPage() {
  const [mounted, setMounted] = useState(false);
  const [riegos, setRiegos] = useState<Riego[]>([]);
  const [ranch, setRanch] = useState(FALLBACK);

  useEffect(() => {
    document.title = "Reporte CONAGUA · WaterSense";
    try {
      const r = JSON.parse(localStorage.getItem("watersense.riegos") || "[]");
      if (Array.isArray(r)) setRiegos(r);
      const list = JSON.parse(localStorage.getItem("watersense.ranches") || "[]");
      const active = localStorage.getItem("watersense.activeRanch");
      const found = Array.isArray(list) ? list.find((x: RanchConfig) => x.id === active) ?? list[0] : null;
      if (found) setRanch({ ...FALLBACK, ...found });
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  const year = new Date().getFullYear();
  const fmt = (n: number) => Math.round(n).toLocaleString("es-MX");
  const yearRiegos = riegos.filter((r) => (r.date || "").slice(0, 4) === String(year));
  const totM3 = yearRiegos.reduce((s, r) => s + (r.m3 || 0), 0);
  const totKwh = yearRiegos.reduce((s, r) => s + (r.kwh || 0), 0);
  const totEnergy = yearRiegos.reduce((s, r) => s + (r.energyCost || 0), 0);
  const totWater = yearRiegos.reduce((s, r) => s + (r.waterCost || 0), 0);
  const concession = ranch.concessionM3Year ?? 0;
  const pct = concession > 0 ? Math.round((totM3 / concession) * 100) : 0;

  const byWell = Object.values(
    yearRiegos.reduce<Record<string, { well: string; events: number; m3: number }>>((acc, r) => {
      const k = r.wellName || "Pozo";
      acc[k] = acc[k] || { well: k, events: 0, m3: 0 };
      acc[k].events += 1;
      acc[k].m3 += r.m3 || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.m3 - a.m3);

  const events = [...yearRiegos].sort((a, b) => (a.date < b.date ? 1 : -1));

  const cellHead: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: fz.xs, color: th.mute, borderBottom: `2px solid ${th.line}`, fontWeight: 600 };
  const cell: React.CSSProperties = { padding: "8px 10px", fontSize: fz.sm, borderBottom: `1px solid ${th.line}` };
  const num: React.CSSProperties = { ...cell, textAlign: "right", fontFamily: FONT.mono };

  if (!mounted) return null;

  return (
    <div style={{ background: th.bg, minHeight: "100vh", color: th.ink, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: `${space.x3}px ${space.x3}px ${space.x4}px` }}>
        {/* barra de acciones (no se imprime) */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg, gap: space.md, flexWrap: "wrap" }}>
          <Link href="/dashboard" style={{ color: C.glacier, fontSize: fz.sm, fontWeight: 600, textDecoration: "none" }}>← {`Volver al panel`}</Link>
          <button onClick={() => window.print()} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "9px 16px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="file" size={15} color="#fff" /> Imprimir / Guardar PDF
          </button>
        </div>

        {/* documento */}
        <div style={{ background: "#fff", border: `1px solid ${th.line}`, borderRadius: radius.lg, padding: space.x3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: space.md, borderBottom: `2px solid ${th.line}`, paddingBottom: space.lg, marginBottom: space.lg, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, letterSpacing: "-0.01em" }}>Reporte de extracción de agua</div>
              <div style={{ fontSize: fz.sm, color: th.soft, marginTop: 2 }}>Cumplimiento de concesión · Ejercicio {year}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
              <Logo size={30} animated={false} />
              <b style={{ fontFamily: FONT.title, fontSize: fz.md }}>WaterSense</b>
            </div>
          </div>

          {/* datos del aprovechamiento */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: space.md, marginBottom: space.x2 }}>
            {[
              ["Titular / rancho", ranch.name || "—"],
              ["Título de concesión (REPDA)", ranch.concessionTitle || "— (registrar en Ajustes)"],
              ["Volumen concesionado", concession > 0 ? `${fmt(concession)} m³/año` : "—"],
              ["Periodo", `1 ene – 31 dic ${year}`],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: fz.sm, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* resumen */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: space.md, padding: space.lg, background: th.panel2, borderRadius: radius.md, marginBottom: space.x2 }}>
            {[
              { l: "Extraído (registrado)", v: `${fmt(totM3)} m³`, c: th.ink },
              { l: "% de la concesión", v: concession > 0 ? `${pct}%` : "—", c: pct >= 90 ? C.critical : pct >= 70 ? C.alert : C.emerald },
              { l: "Energía de bombeo", v: `$${fmt(totEnergy)}`, c: th.ink },
              { l: "Derechos de agua", v: `$${fmt(totWater)}`, c: th.ink },
              { l: "Eventos de riego", v: `${yearRiegos.length}`, c: th.ink },
            ].map((m) => (
              <div key={m.l}>
                <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: 4 }}>{m.l}</div>
                <div className="mono" style={{ fontSize: fz.lg, fontWeight: 700, color: m.c }}>{m.v}</div>
              </div>
            ))}
          </div>

          {yearRiegos.length === 0 ? (
            <div style={{ fontSize: fz.sm, color: th.soft, fontStyle: "italic", padding: `${space.lg}px 0` }}>
              No hay riegos registrados en {year}. Captura riegos en la Bitácora para poblar este reporte.
            </div>
          ) : (
            <>
              {/* por pozo */}
              <div style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.md, margin: `${space.sm}px 0 ${space.sm}px` }}>Extracción por pozo</div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: space.x2 }}>
                <thead><tr><th style={cellHead}>Pozo</th><th style={{ ...cellHead, textAlign: "right" }}>Eventos</th><th style={{ ...cellHead, textAlign: "right" }}>Volumen</th></tr></thead>
                <tbody>
                  {byWell.map((w) => (
                    <tr key={w.well}><td style={cell}>{w.well}</td><td style={num}>{w.events}</td><td style={num}>{fmt(w.m3)} m³</td></tr>
                  ))}
                </tbody>
              </table>

              {/* detalle */}
              <div style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.md, margin: `${space.sm}px 0 ${space.sm}px` }}>Detalle de eventos</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={cellHead}>Fecha</th><th style={cellHead}>Pozo</th><th style={cellHead}>Parcela</th><th style={{ ...cellHead, textAlign: "right" }}>Horas</th><th style={{ ...cellHead, textAlign: "right" }}>m³</th><th style={{ ...cellHead, textAlign: "right" }}>kWh</th></tr></thead>
                <tbody>
                  {events.map((r, i) => (
                    <tr key={i}>
                      <td style={cell}>{new Date(`${r.date}T12:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td style={cell}>{r.wellName || "—"}</td>
                      <td style={cell}>{r.parcelName || "—"}</td>
                      <td style={num}>{r.hours ?? "—"}</td>
                      <td style={num}>{fmt(r.m3)}</td>
                      <td style={num}>{fmt(r.kwh)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div style={{ fontSize: fz.micro, color: th.mute, marginTop: space.x2, paddingTop: space.lg, borderTop: `1px solid ${th.line}`, lineHeight: 1.6 }}>
            Reporte generado por WaterSense a partir de la bitácora de riego del productor. Demostración con datos simulados;
            no sustituye los medios oficiales de medición ni los reportes formales ante la Comisión Nacional del Agua (CONAGUA).
            Generado el {new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}.
          </div>
        </div>
      </div>
    </div>
  );
}
