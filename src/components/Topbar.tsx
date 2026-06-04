"use client";

import { C, FONT, radius, space, fz, type Lang, type Theme, type ThemeMode } from "@/lib/theme";
import { Icon } from "./Icon";
import type { ViewId } from "./Sidebar";

function Seg<V extends string>({
  th,
  val,
  set,
  opts,
}: {
  th: Theme;
  val: V;
  set: (v: V) => void;
  opts: { v: V; l: string }[];
}) {
  return (
    <div style={{ display: "flex", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: 2, cursor: "pointer", fontSize: fz.xs }}>
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => set(o.v)}
          aria-pressed={val === o.v}
          style={{
            padding: "4px 11px",
            borderRadius: radius.sm,
            whiteSpace: "nowrap",
            border: "none",
            cursor: "pointer",
            fontSize: fz.xs,
            fontWeight: val === o.v ? 600 : 500,
            background: val === o.v ? th.panel : "transparent",
            color: val === o.v ? th.ink : th.mute,
            boxShadow: val === o.v ? "0 1px 2px rgba(11,32,48,.08)" : "none",
            transition: ".15s",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function Topbar({
  th,
  mode,
  setMode,
  lang,
  setLang,
  tr,
  view,
}: {
  th: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (s: string, t: string) => string;
  view: ViewId;
}) {
  const titles: Record<ViewId, string> = {
    mapa: tr("Mapa del campo", "Command map · campo"),
    finca: tr("Mi finca", "Auditoría"),
    costos: tr("Costos", "Costos operativos"),
    futuro: tr("Futuro del agua", "Proyección del acuífero"),
    pozos: tr("Mis pozos", "Salud de pozos"),
    docs: tr("Ayuda", "Documentación"),
  };
  const iconBtn: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    cursor: "pointer",
    background: th.panel2,
    border: `1px solid ${th.line}`,
    borderRadius: radius.md,
    color: th.soft,
    padding: 0,
  };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${space.md}px ${space.x2}px`, borderBottom: `1px solid ${th.line}`, background: th.panel, gap: space.md }}>
      <div>
        <h1 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.lg, letterSpacing: "-0.01em" }}>{titles[view]}</h1>
        <div className="mono" style={{ fontSize: fz.micro, color: th.mute, marginTop: 2 }}>
          {tr("Rancho El Álamo · Delicias, Chihuahua", "28.190° N · 105.470° O · Delicias, Chihuahua")}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: space.sm }}>
        <Seg<Lang>
          th={th}
          val={lang}
          set={setLang}
          opts={[
            { v: "simple", l: tr("Simple", "Modo simple") },
            { v: "tech", l: tr("Técnico", "Modo técnico") },
          ]}
        />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            fontSize: fz.xs,
            color: th.soft,
            background: th.panel2,
            border: `1px solid ${th.line}`,
            padding: "6px 11px",
            borderRadius: radius.md,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.emerald }} />
          <span className="mono">{tr("En línea", "8 sensores · 3 pozos")}</span>
        </div>
        <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} style={iconBtn} title={tr("Cambiar tema", "Tema")} aria-label={tr("Cambiar tema", "Cambiar tema")}>
          <Icon name={mode === "dark" ? "sun" : "moon"} size={15} color={th.soft} />
        </button>
      </div>
    </div>
  );
}
