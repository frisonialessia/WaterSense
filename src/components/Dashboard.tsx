"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CostItem, Parcel, Well, Region, CropProfile } from "@/types/domain";
import type { PumpHealth } from "@/lib/brain/pumpHealth";
import { T, makeTr, type Lang, type ThemeMode } from "@/lib/theme";
import { Sidebar, type ViewId } from "./Sidebar";
import { Topbar } from "./Topbar";
import { KpiStrip } from "./KpiStrip";
import { DocsView } from "./views/DocsView";
import { Placeholder } from "./views/Placeholder";

// MapLibre is heavy — load the map only when the user opens that view.
const MapView = dynamic(() => import("./views/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 30, fontSize: 13, color: "#84A0A8" }}>Cargando mapa…</div>
  ),
});

export interface DashboardData {
  costs: CostItem[];
  parcels: Parcel[];
  wells: Well[];
  pumps: PumpHealth[];
  regions: Region[];
  crops: CropProfile[];
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [lang, setLang] = useState<Lang>("simple");
  const [view, setView] = useState<ViewId>("finca");
  const th = T[mode];
  const tr = makeTr(lang);

  return (
    <div style={{ minHeight: "100vh", height: "100vh", background: th.bg, color: th.ink, display: "flex", transition: "background .35s" }}>
      <style>{`.nav:hover{background:${th.panel2}!important;color:${th.ink}!important}`}</style>
      <Sidebar th={th} mode={mode} view={view} setView={setView} tr={tr} costs={data.costs} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar th={th} mode={mode} setMode={setMode} lang={lang} setLang={setLang} tr={tr} view={view} />
        <KpiStrip th={th} tr={tr} costs={data.costs} parcels={data.parcels} wells={data.wells} pumps={data.pumps} />
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {view === "mapa" ? (
            <MapView th={th} mode={mode} tr={tr} parcels={data.parcels} wells={data.wells} regions={data.regions} crops={data.crops} />
          ) : view === "docs" ? (
            <DocsView th={th} tr={tr} />
          ) : (
            <Placeholder th={th} tr={tr} view={view} />
          )}
        </div>
      </main>
    </div>
  );
}
