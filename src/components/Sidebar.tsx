"use client";

import type { CostItem } from "@/types/domain";
import { C, FONT, fmt, type Theme, type ThemeMode } from "@/lib/theme";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

export type ViewId = "finca" | "mapa" | "costos" | "futuro" | "pozos" | "docs";

const ITEMS: { id: ViewId; icon: string; s: string; t: string }[] = [
  { id: "finca", icon: "home", s: "Mi finca", t: "Auditoría" },
  { id: "mapa", icon: "map", s: "Mapa del campo", t: "Command map" },
  { id: "costos", icon: "coin", s: "Costos", t: "Costos" },
  { id: "futuro", icon: "chart", s: "Futuro del agua", t: "Proyección acuífero" },
  { id: "pozos", icon: "wrench", s: "Mis pozos", t: "Salud de pozos" },
  { id: "docs", icon: "book", s: "Ayuda", t: "Documentación" },
];

export function Sidebar({
  th,
  mode,
  view,
  setView,
  tr,
  costs,
}: {
  th: Theme;
  mode: ThemeMode;
  view: ViewId;
  setView: (v: ViewId) => void;
  tr: (s: string, t: string) => string;
  costs: CostItem[];
}) {
  const total = costs.reduce((s, c) => s + c.month, 0);
  return (
    <aside
      style={{
        width: 240,
        background: th.panel,
        borderRight: `1px solid ${th.line}`,
        padding: "20px 15px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "4px 8px", marginBottom: 22 }}>
        <Logo size={30} light={mode === "dark"} />
        <b style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: 18, letterSpacing: "-0.03em" }}>WaterSense</b>
      </div>
      {ITEMS.map((it) => (
        <div
          key={it.id}
          className="nav"
          onClick={() => setView(it.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 10px",
            borderRadius: 9,
            cursor: "pointer",
            fontSize: 13.5,
            marginBottom: 2,
            transition: ".2s",
            position: "relative",
            background: view === it.id ? th.panel2 : "transparent",
            color: view === it.id ? th.ink : th.soft,
          }}
        >
          {view === it.id && (
            <span style={{ position: "absolute", left: 0, width: 3, height: 15, background: C.teal, borderRadius: 2, boxShadow: `0 0 8px ${C.teal}` }} />
          )}
          <span style={{ width: 18, display: "flex", justifyContent: "center" }}>
            <Icon name={it.icon} size={16} color={view === it.id ? C.teal : th.mute} />
          </span>
          {tr(it.s, it.t)}
        </div>
      ))}
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".12em", color: th.mute, padding: "0 10px", margin: "18px 0 8px" }}>
        {tr("Gasto del mes", "Costos mensuales")}
      </div>
      <div style={{ padding: "0 6px" }}>
        {costs.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 6px", fontSize: 12 }}>
            <span style={{ color: th.soft, display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name={c.icon} size={13} color={th.soft} />
              {tr(c.label.split(" ")[0], c.label)}
            </span>
            <span className="mono" style={{ color: th.mute }}>${(c.month / 1000).toFixed(1)}k</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 6px 0", marginTop: 6, borderTop: `1px solid ${th.line}`, fontSize: 12.5 }}>
          <span style={{ fontWeight: 600 }}>Total</span>
          <span className="mono" style={{ fontWeight: 700, color: C.teal }}>${fmt(total)}</span>
        </div>
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "12px 8px 0", borderTop: `1px solid ${th.line}` }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: `linear-gradient(135deg,${C.glacier},${C.emerald})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 13,
            color: "#fff",
          }}
        >
          R
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Rancho El Álamo</div>
          <div style={{ fontSize: 11.5, color: th.mute }}>38 ha · Chihuahua</div>
        </div>
      </div>
    </aside>
  );
}
