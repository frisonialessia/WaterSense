"use client";

import { C, FONT, type Lang, type Theme, type ThemeMode } from "@/lib/theme";
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
    <div style={{ display: "flex", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: 999, padding: 3, cursor: "pointer", fontSize: 12 }}>
      {opts.map((o) => (
        <div
          key={o.v}
          onClick={() => set(o.v)}
          style={{ padding: "5px 12px", borderRadius: 999, whiteSpace: "nowrap", background: val === o.v ? C.cyan : "transparent", color: val === o.v ? "#fff" : th.mute, transition: ".2s" }}
        >
          {o.l}
        </div>
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
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 26px", borderBottom: `1px solid ${th.line}`, background: th.panel, gap: 14 }}>
      <div>
        <h1 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: 19, letterSpacing: "-0.02em" }}>{titles[view]}</h1>
        <div style={{ fontSize: 12, color: th.soft, marginTop: 2 }}>
          {tr("Rancho El Álamo · Delicias, Chihuahua", "28.190° N, 105.470° W · Delicias, Chihuahua")}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            gap: 8,
            fontSize: 12,
            color: th.soft,
            background: th.panel2,
            border: `1px solid ${th.line}`,
            padding: "7px 13px",
            borderRadius: 999,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.teal, boxShadow: `0 0 8px ${C.teal}`, animation: "pulse 2s infinite" }} />
          {tr("Todo en línea", "8 sensores · 3 pozos")}
        </div>
        <div
          onClick={() => setMode(mode === "dark" ? "light" : "dark")}
          style={{ cursor: "pointer", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: 999, padding: "7px 11px", fontSize: 13 }}
        >
          {mode === "dark" ? "☾" : "☀"}
        </div>
      </div>
    </div>
  );
}
