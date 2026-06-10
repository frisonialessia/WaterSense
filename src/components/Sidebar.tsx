"use client";

import Link from "next/link";
import type { CostItem, RanchConfig, Region } from "@/types/domain";
import { C, FONT, fmt, radius, space, fz, labelStyle, type Theme, type ThemeMode, type Lang } from "@/lib/theme";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

export type ViewId = "finca" | "mapa" | "costos" | "riego" | "futuro" | "estudio" | "pozos" | "docs" | "ajustes";

type Item = { id: ViewId; icon: string; s: string; t: string };

const TOP_ITEMS: Item[] = [
  { id: "finca", icon: "home", s: "Mi rancho", t: "Auditoría" },
  { id: "mapa", icon: "map", s: "Mapa del campo", t: "Command map" },
  { id: "costos", icon: "coin", s: "Costos", t: "Costos" },
  { id: "riego", icon: "drop", s: "Bitácora de riego", t: "Bitácora · riegos" },
  { id: "futuro", icon: "chart", s: "Futuro del agua", t: "Proyección acuífero" },
  { id: "estudio", icon: "file", s: "Estudio de riego (IA)", t: "Estudio de riego (IA)" },
];

const BOTTOM_ITEMS: Item[] = [
  { id: "pozos", icon: "wrench", s: "Mis pozos", t: "Salud de pozos" },
  { id: "docs", icon: "book", s: "Ayuda", t: "Documentación" },
  { id: "ajustes", icon: "sliders", s: "Ajustes", t: "Configuración" },
];

export function Sidebar({
  th,
  mode,
  view,
  setView,
  tr,
  costs,
  ranch,
  regions = [],
  mobile = false,
  open = false,
  lang,
  setLang,
}: {
  th: Theme;
  mode: ThemeMode;
  view: ViewId;
  setView: (v: ViewId) => void;
  tr: (s: string, t: string) => string;
  costs: CostItem[];
  ranch: RanchConfig;
  regions?: Region[];
  mobile?: boolean;
  open?: boolean;
  lang?: Lang;
  setLang?: (l: Lang) => void;
}) {
  const total = costs.reduce((s, c) => s + c.month, 0);

  const mobileStyle: React.CSSProperties = mobile
    ? { position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 41, transform: open ? "translateX(0)" : "translateX(-110%)", transition: "transform .25s ease", boxShadow: open ? "0 12px 40px rgba(0,0,0,.35)" : "none", width: 248 }
    : {};

  const renderItem = (it: Item) => {
    const active = view === it.id;
    return (
      <div
        key={it.id}
        className="nav"
        role="button"
        tabIndex={0}
        aria-current={active ? "page" : undefined}
        onClick={() => setView(it.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setView(it.id);
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: space.sm + 2,
          padding: "7px 9px",
          borderRadius: radius.md,
          cursor: "pointer",
          fontSize: fz.sm,
          fontWeight: active ? 600 : 500,
          marginBottom: 1,
          transition: "background .15s,color .15s",
          position: "relative",
          background: active ? th.panel2 : "transparent",
          color: active ? th.ink : th.soft,
        }}
      >
        {active && <span style={{ position: "absolute", left: 0, top: 7, bottom: 7, width: 2, background: C.glacier, borderRadius: 2 }} />}
        <span style={{ width: 18, display: "flex", justifyContent: "center" }}>
          <Icon name={it.icon} size={16} color={active ? C.glacier : th.mute} />
        </span>
        {tr(it.s, it.t)}
      </div>
    );
  };
  return (
    <aside
      style={{
        width: 218,
        background: th.panel,
        borderRight: `1px solid ${th.line}`,
        padding: `${space.lg}px ${space.md}px`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        ...mobileStyle,
      }}
    >
      <Link href="/" title={tr("Ir al inicio", "Inicio")} style={{ display: "flex", alignItems: "center", gap: space.sm, padding: `0 ${space.sm}px`, marginBottom: space.x2, textDecoration: "none", color: "inherit" }}>
        <Logo size={26} light={mode === "dark"} />
        <b style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.md, letterSpacing: "-0.02em", flex: 1 }}>WaterSense</b>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: ".08em",
            color: C.glacier,
            border: `1px solid ${C.glacier}44`,
            borderRadius: radius.sm,
            padding: "2px 5px",
          }}
        >
          DEMO
        </span>
      </Link>

      {mobile && lang && setLang && (
        <div style={{ marginBottom: space.lg }}>
          <div style={{ ...labelStyle(th), padding: `0 ${space.sm}px`, marginBottom: space.sm }}>{tr("Modo de lectura", "Modo")}</div>
          <div style={{ display: "flex", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: 2 }}>
            {([["simple", tr("Simple", "Simple")], ["tech", tr("Técnico", "Técnico")]] as [Lang, string][]).map(([v, l]) => (
              <button key={v} onClick={() => setLang(v)} style={{ flex: 1, padding: "8px 0", borderRadius: radius.sm, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: fz.xs, fontWeight: lang === v ? 600 : 500, background: lang === v ? th.panel : "transparent", color: lang === v ? th.ink : th.mute }}>{l}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...labelStyle(th), padding: `0 ${space.sm}px`, marginBottom: space.sm }}>{tr("Navegación", "Vistas")}</div>
      {TOP_ITEMS.map(renderItem)}

      <div style={{ ...labelStyle(th), padding: `0 ${space.sm}px`, margin: `${space.lg}px 0 ${space.sm}px` }}>{tr("Gasto del mes", "Costos mensuales")}</div>
      <div style={{ padding: `0 ${space.xs}px` }}>
        {costs.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px", fontSize: fz.xs }}>
            <span style={{ color: th.soft, display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <Icon name={c.icon === "bolt" ? "bolt2" : c.icon} size={12} color={th.mute} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tr(c.label.split(" ")[0], c.label)}</span>
            </span>
            <span className="mono" style={{ color: th.soft }}>${(c.month / 1000).toFixed(1)}k</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: `${space.sm}px 6px 0`, marginTop: 4, borderTop: `1px solid ${th.line}`, fontSize: fz.xs }}>
          <span style={{ fontWeight: 600 }}>Total</span>
          <span className="mono" style={{ fontWeight: 700, color: th.ink }}>${fmt(total)}</span>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: space.md }}>
        {BOTTOM_ITEMS.map(renderItem)}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: space.sm, padding: `${space.md}px ${space.xs}px 0`, marginTop: space.sm, borderTop: `1px solid ${th.line}` }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: radius.md,
            background: `linear-gradient(135deg,${C.glacier},${C.emerald})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: fz.xs,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {(ranch.name || "R").charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: fz.sm, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ranch.name}</div>
          <div style={{ fontSize: fz.micro, color: th.mute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ranch.hectares} ha · {(regions.find((r) => r.id === ranch.regionId)?.name ?? "Chihuahua").split(",")[0]}</div>
        </div>
      </div>
    </aside>
  );
}
