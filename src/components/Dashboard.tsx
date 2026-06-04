"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CostItem, Parcel, Well, Region, CropProfile, WeatherDay, ScheduledAction, SavingsSummary } from "@/types/domain";
import type { PumpHealth } from "@/lib/brain/pumpHealth";
import { T, makeTr, type Lang, type ThemeMode } from "@/lib/theme";
import { Sidebar, type ViewId } from "./Sidebar";
import { Topbar } from "./Topbar";
import { KpiStrip } from "./KpiStrip";
import { DocsView } from "./views/DocsView";
import { CostosView } from "./views/CostosView";
import { FincaView } from "./views/FincaView";
import { PozosView } from "./views/PozosView";
import { Agent } from "./Agent";

const loader = (label: string) => () => <div style={{ padding: 30, fontSize: 13, color: "#84A0A8" }}>{label}</div>;

// Heavy deps (MapLibre, Recharts) load only when their view is opened.
const MapView = dynamic(() => import("./views/MapView").then((m) => m.MapView), { ssr: false, loading: loader("Cargando mapa…") });
const FuturoView = dynamic(() => import("./views/FuturoView").then((m) => m.FuturoView), { ssr: false, loading: loader("Cargando proyección…") });

export interface DashboardData {
  costs: CostItem[];
  parcels: Parcel[];
  wells: Well[];
  pumps: PumpHealth[];
  regions: Region[];
  crops: CropProfile[];
  tariffCurve: number[];
  forecast: WeatherDay[];
  actions: ScheduledAction[];
  savings: SavingsSummary;
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
          ) : view === "costos" ? (
            <CostosView th={th} tr={tr} costs={data.costs} tariffCurve={data.tariffCurve} parcels={data.parcels} />
          ) : view === "futuro" ? (
            <FuturoView th={th} tr={tr} />
          ) : view === "pozos" ? (
            <PozosView th={th} tr={tr} wells={data.wells} pumps={data.pumps} />
          ) : view === "docs" ? (
            <DocsView th={th} tr={tr} />
          ) : (
            <FincaView th={th} tr={tr} setView={setView} parcels={data.parcels} forecast={data.forecast} actions={data.actions} savings={data.savings} />
          )}
        </div>
      </main>
      <Agent th={th} tr={tr} />
    </div>
  );
}
