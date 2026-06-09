"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { CostItem, Parcel, Well, Region, CropProfile, WeatherDay, ScheduledAction, SavingsSummary, KpiTrends, AquiferNeighborhood, WaterConcession, RanchConfig } from "@/types/domain";
import { assessPump, type PumpHealth } from "@/lib/brain/pumpHealth";
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

const DEFAULT_RANCH: RanchConfig = { id: "ranch-1", name: "Rancho El Álamo", owner: "", regionId: "delicias", lat: 28.19, lng: -105.47, altitudeM: 1170, hectares: 38, mainCrop: "Nogal pecanero", tariffType: "Nocturna (CFE)", notes: "", concessionM3Year: 320000, concessionTitle: "", contractedKw: 110, cfeService: "", phone: "" };

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

  // Mobile: the sidebar becomes a slide-in drawer with a hamburger.
  const [isMobile, setIsMobile] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const apply = () => {
      setIsMobile(mq.matches);
      if (!mq.matches) setNavOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // navigate + close drawer on mobile
  const go = (v: ViewId) => {
    setView(v);
    setNavOpen(false);
  };

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

  // Ranch settings — the user can keep several ranches and switch between them.
  // Persisted client-side in the PoC (with Supabase each is a row in `ranches`).
  const [ranches, setRanches] = useState<RanchConfig[]>([DEFAULT_RANCH]);
  const [activeRanchId, setActiveRanchId] = useState<string>(DEFAULT_RANCH.id);
  useEffect(() => {
    try {
      const rawList = localStorage.getItem("watersense.ranches");
      if (rawList) {
        const list = JSON.parse(rawList) as RanchConfig[];
        if (Array.isArray(list) && list.length) setRanches(list.map((r) => ({ ...DEFAULT_RANCH, ...r })));
      } else {
        // migrate the old single-ranch key, if present
        const legacy = localStorage.getItem("watersense.ranch");
        if (legacy) setRanches([{ ...DEFAULT_RANCH, ...JSON.parse(legacy) }]);
      }
      const active = localStorage.getItem("watersense.activeRanch");
      if (active) setActiveRanchId(active);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.ranches", JSON.stringify(ranches));
      localStorage.setItem("watersense.activeRanch", activeRanchId);
    } catch {
      /* ignore */
    }
  }, [ranches, activeRanchId]);
  const ranch = ranches.find((r) => r.id === activeRanchId) ?? ranches[0];
  const setRanch = (r: RanchConfig) => setRanches((prev) => prev.map((x) => (x.id === r.id ? r : x)));
  const addRanch = () => {
    const id = `ranch-${Date.now()}`;
    setRanches((prev) => [...prev, { ...DEFAULT_RANCH, id, name: `${tr("Rancho nuevo", "Rancho nuevo")} ${ranches.length + 1}`, owner: "", notes: "", concessionTitle: "", cfeService: "", phone: "" }]);
    setActiveRanchId(id);
  };
  const removeRanch = (id: string) =>
    setRanches((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((r) => r.id !== id);
      if (id === activeRanchId) setActiveRanchId(next[0].id);
      return next;
    });

  // Wells are editable in the PoC (rename / add / remove), persisted locally.
  // Pump health is recomputed by the brain whenever the wells change.
  const [wells, setWells] = useState<Well[]>(data.wells);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("watersense.wells");
      if (raw) setWells(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.wells", JSON.stringify(wells));
    } catch {
      /* ignore */
    }
  }, [wells]);
  const pumps = useMemo(() => wells.map((w) => assessPump(w, w.ok ? 0 : 18)), [wells]);
  const updateWell = (id: string, patch: Partial<Well>) =>
    setWells((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch, ok: (patch.currentFlowLph ?? w.currentFlowLph) <= (patch.sustainableFlowLph ?? w.sustainableFlowLph) } : w)));
  const addWell = () =>
    setWells((prev) => [
      ...prev,
      { id: `well-${Date.now()}`, name: `Pozo nuevo ${prev.length + 1}`, currentFlowLph: 5000, sustainableFlowLph: 6000, depthM: 90, ratedStarts: 18000, starts: 2000, ok: true, lat: ranch.lat + (Math.random() - 0.5) * 0.01, lng: ranch.lng + (Math.random() - 0.5) * 0.01 },
    ]);
  const removeWell = (id: string) => setWells((prev) => prev.filter((w) => w.id !== id));

  // Neighbors sharing the aquifer are editable too (add who you share water
  // with), persisted locally. Seeded from the simulated REPDA list.
  const [concessions, setConcessions] = useState<WaterConcession[]>(data.aquifer.concessions);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("watersense.concessions");
      if (raw) setConcessions(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.concessions", JSON.stringify(concessions));
    } catch {
      /* ignore */
    }
  }, [concessions]);
  const aquifer = useMemo(() => ({ ...data.aquifer, concessions }), [data.aquifer, concessions]);
  const addConcession = (c: WaterConcession) => setConcessions((prev) => [...prev, c]);
  const removeConcession = (id: string) => setConcessions((prev) => prev.filter((c) => c.id !== id));

  // Cost rubros are editable & expandable in the PoC (edit amount/note, add new),
  // persisted locally and seeded from the repository. Feeds KPI + sidebar live.
  const [costItems, setCostItems] = useState<CostItem[]>(data.costs);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("watersense.costItems");
      if (raw) {
        const list = JSON.parse(raw) as CostItem[];
        if (Array.isArray(list) && list.length) setCostItems(list);
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("watersense.costItems", JSON.stringify(costItems));
    } catch {
      /* ignore */
    }
  }, [costItems]);
  const updateCost = (id: string, patch: Partial<CostItem>) => setCostItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addCost = (label: string): string => {
    const id = `cost-${Date.now()}`;
    setCostItems((prev) => [...prev, { id, label, icon: "coin", month: 0, trend: 0, note: "" }]);
    return id;
  };
  const removeCost = (id: string) => setCostItems((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="ws-app-shell" style={{ background: th.bg, color: th.ink, display: "flex", transition: "background .35s" }}>
      <style>{`.nav:hover{background:${th.panel2}!important;color:${th.ink}!important}`}</style>
      {isMobile && navOpen && (
        <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 40 }} />
      )}
      <Sidebar th={th} mode={mode} view={view} setView={go} tr={tr} costs={costItems} ranch={ranch} regions={data.regions} mobile={isMobile} open={navOpen} lang={lang} setLang={setLang} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        <Topbar th={th} mode={mode} setMode={setMode} lang={lang} setLang={setLang} tr={tr} view={view} ranch={ranch} regions={data.regions} ranches={ranches} activeRanchId={activeRanchId} onSwitchRanch={setActiveRanchId} onAddRanch={addRanch} onMenu={isMobile ? () => setNavOpen((o) => !o) : undefined} />
        <KpiStrip th={th} tr={tr} costs={costItems} parcels={allParcels} wells={wells} pumps={pumps} trends={data.trends} onNavigate={go} />
        <div style={{ flex: 1, overflow: "auto", minHeight: 0, paddingBottom: isMobile ? 96 : 0 }}>
          {view === "mapa" ? (
            <MapView th={th} mode={mode} tr={tr} parcels={allParcels} userParcels={userParcels} onAddParcel={addParcel} onRemoveParcel={removeParcel} wells={wells} regions={data.regions} crops={data.crops} />
          ) : view === "costos" ? (
            <CostosView th={th} tr={tr} costs={costItems} tariffCurve={data.tariffCurve} parcels={allParcels} crops={data.crops} onUpdateCost={updateCost} onAddCost={addCost} onRemoveCost={removeCost} />
          ) : view === "futuro" ? (
            <FuturoView th={th} tr={tr} />
          ) : view === "estudio" ? (
            <StudyView th={th} tr={tr} ranch={ranch} />
          ) : view === "pozos" ? (
            <PozosView th={th} tr={tr} wells={wells} pumps={pumps} aquifer={aquifer} onUpdate={updateWell} onAdd={addWell} onRemove={removeWell} onAddConcession={addConcession} onRemoveConcession={removeConcession} />
          ) : view === "docs" ? (
            <DocsView th={th} tr={tr} />
          ) : view === "ajustes" ? (
            <SettingsView th={th} tr={tr} ranch={ranch} setRanch={setRanch} regions={data.regions} crops={data.crops} ranches={ranches} activeRanchId={activeRanchId} onSwitchRanch={setActiveRanchId} onAddRanch={addRanch} onRemoveRanch={removeRanch} />
          ) : (
            <FincaView th={th} tr={tr} lang={lang} setView={go} parcels={allParcels} crops={data.crops} tariffCurve={data.tariffCurve} tariffType={ranch.tariffType} lat={ranch.lat} lng={ranch.lng} forecast={data.forecast} actions={data.actions} savings={data.savings} />
          )}
        </div>
      </main>
      <Agent th={th} tr={tr} />
    </div>
  );
}
