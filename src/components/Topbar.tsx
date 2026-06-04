"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RanchConfig, Region } from "@/types/domain";
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
  ranch,
  regions,
  onMenu,
}: {
  th: Theme;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: (s: string, t: string) => string;
  view: ViewId;
  ranch: RanchConfig;
  regions: Region[];
  onMenu?: () => void;
}) {
  const titles: Record<ViewId, string> = {
    mapa: tr("Mapa del campo", "Command map · campo"),
    finca: tr("Mi rancho", "Auditoría"),
    costos: tr("Costos", "Costos operativos"),
    futuro: tr("Futuro del agua", "Proyección del acuífero"),
    estudio: tr("Estudio de riego (IA)", "Estudio de riego asistido por IA"),
    pozos: tr("Mis pozos", "Salud de pozos"),
    docs: tr("Ayuda", "Documentación"),
    ajustes: tr("Ajustes", "Configuración"),
  };
  const regionName = regions.find((r) => r.id === ranch.regionId)?.name ?? "Chihuahua";

  const [online, setOnline] = useState(true);
  useEffect(() => {
    const up = () => setOnline(navigator.onLine);
    up();
    window.addEventListener("online", up);
    window.addEventListener("offline", up);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", up);
    };
  }, []);

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
      <div style={{ display: "flex", alignItems: "center", gap: space.sm, minWidth: 0 }}>
        {onMenu && (
          <button onClick={onMenu} aria-label={tr("Menú", "Menú")} style={{ ...iconBtn, flexShrink: 0 }}>
            <Icon name="menu" size={16} color={th.soft} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.lg, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titles[view]}</h1>
          <div className="mono" style={{ fontSize: fz.micro, color: th.mute, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tr(`${ranch.name} · ${regionName}`, `${ranch.lat.toFixed(3)}° N · ${Math.abs(ranch.lng).toFixed(3)}° O · ${regionName}`)}
          </div>
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
            border: `1px solid ${online ? th.line : C.alert + "55"}`,
            padding: "6px 11px",
            borderRadius: radius.md,
          }}
          title={online ? undefined : tr("Sin conexión: seguimos con tus datos guardados", "Offline · datos cacheados")}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: online ? C.emerald : C.alert }} />
          <span className="mono">{online ? tr("En línea", "8 sensores · 3 pozos") : tr("Sin conexión", "Offline")}</span>
        </div>
        <Link
          href="/reporte"
          target="_blank"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: fz.xs, fontWeight: 600, color: th.soft, background: th.panel2, border: `1px solid ${th.line}`, padding: "6px 11px", borderRadius: radius.md, textDecoration: "none" }}
          title={tr("Reporte para socios", "Reporte PDF")}
        >
          <Icon name="book" size={14} color={th.soft} />
          {tr("Reporte", "Reporte")}
        </Link>
        <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} style={iconBtn} title={tr("Cambiar tema", "Tema")} aria-label={tr("Cambiar tema", "Cambiar tema")}>
          <Icon name={mode === "dark" ? "sun" : "moon"} size={15} color={th.soft} />
        </button>
      </div>
    </div>
  );
}
