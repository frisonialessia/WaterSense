"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CostItem, Parcel, Well, Region, CropProfile, WeatherDay, ScheduledAction, SavingsSummary, KpiTrends, AquiferNeighborhood, RanchConfig } from "@/types/domain";
import type { PumpHealth } from "@/lib/brain/pumpHealth";
import { T, makeTr, type Lang, type ThemeMode } from "@/lib/theme";
import { Sidebar, type ViewId } from "./Sidebar";
import { Topbar } from "./Topbar";
import { KpiStrip } from "./KpiStrip";
import { DocsView } from "./views/DocsView";
import { CostosView } from "./views/CostosView";
import { FincaView } from "./views/FincaView";
import { PozosView } from "./views/PozosView";
import { SettingsView } from "./views/SettingsView";
import { StudyView } from "./views/StudyView";
import { Agent } from "./Agent";

const DEFAULT_RANCH: RanchConfig = { name: "Rancho El Álamo", owner: "", regionId: "delicias", lat: 28.19, lng: -105.47, altitudeM: 1170, hectares: 38, mainCrop: "Nogal pecanero", notes: "" };

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
  trends: KpiTrends;
  aquifer: AquiferNeighborhood;
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [lang, setLang] = useState<Lang>("simple");
  const [view, setView] = useState<ViewId>("finca");
  const th = T[mode];
  const tr = makeTr(lang);

  // Parcels the farmer draws live in the browser (localStorage) in the PoC.
  // In Fase 3 these would persist via repository.addParcel/removeParcel.
  const [userParcels, setUserParcels] = useState<Parcel[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("watersense.userParcels");
      if (raw) setUserParcels(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.userParcels", JSON.stringify(userParcels));
    } catch {
      /* ignore */
    }
  }, [userParcels]);
  const allParcels = useMemo(() => [...data.parcels, ...userParcels], [data.parcels, userParcels]);
  const addParcel = (p: Parcel) => setUserParcels((prev) => [...prev, p]);
  const removeParcel = (id: string) => setUserParcels((prev) => prev.filter((x) => x.id !== id));

  // Ranch settings (persisted client-side in the PoC).
  const [ranch, setRanch] = useState<RanchConfig>(DEFAULT_RANCH);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("watersense.ranch");
      if (raw) setRanch({ ...DEFAULT_RANCH, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.ranch", JSON.stringify(ranch));
    } catch {
      /* ignore */
    }
  }, [ranch]);

  return (
    <div style={{ minHeight: "100vh", height: "100vh", background: th.bg, color: th.ink, display: "flex", transition: "background .35s" }}>
      <style>{`.nav:hover{background:${th.panel2}!important;color:${th.ink}!important}`}</style>
      <Sidebar th={th} mode={mode} view={view} setView={setView} tr={tr} costs={data.costs} ranch={ranch} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar th={th} mode={mode} setMode={setMode} lang={lang} setLang={setLang} tr={tr} view={view} ranch={ranch} regions={data.regions} />
        <KpiStrip th={th} tr={tr} costs={data.costs} parcels={allParcels} wells={data.wells} pumps={data.pumps} trends={data.trends} />
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {view === "mapa" ? (
            <MapView th={th} mode={mode} tr={tr} parcels={allParcels} userParcels={userParcels} onAddParcel={addParcel} onRemoveParcel={removeParcel} wells={data.wells} regions={data.regions} crops={data.crops} />
          ) : view === "costos" ? (
            <CostosView th={th} tr={tr} costs={data.costs} tariffCurve={data.tariffCurve} parcels={allParcels} />
          ) : view === "futuro" ? (
            <FuturoView th={th} tr={tr} />
          ) : view === "estudio" ? (
            <StudyView th={th} tr={tr} ranch={ranch} />
          ) : view === "pozos" ? (
            <PozosView th={th} tr={tr} wells={data.wells} pumps={data.pumps} aquifer={data.aquifer} />
          ) : view === "docs" ? (
            <DocsView th={th} tr={tr} />
          ) : view === "ajustes" ? (
            <SettingsView th={th} tr={tr} ranch={ranch} setRanch={setRanch} regions={data.regions} crops={data.crops} />
          ) : (
            <FincaView th={th} tr={tr} setView={setView} parcels={allParcels} crops={data.crops} tariffCurve={data.tariffCurve} forecast={data.forecast} actions={data.actions} savings={data.savings} />
          )}
        </div>
      </main>
      <Agent th={th} tr={tr} />
    </div>
  );
}
