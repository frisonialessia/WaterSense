"use client";

import { useState } from "react";
import type { CostItem } from "@/types/domain";
import { T, makeTr, type Lang, type ThemeMode } from "@/lib/theme";
import { Sidebar, type ViewId } from "./Sidebar";
import { Topbar } from "./Topbar";
import { DocsView } from "./views/DocsView";
import { Placeholder } from "./views/Placeholder";

export interface DashboardData {
  costs: CostItem[];
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [lang, setLang] = useState<Lang>("simple");
  const [view, setView] = useState<ViewId>("mapa");
  const th = T[mode];
  const tr = makeTr(lang);

  return (
    <div style={{ minHeight: "100vh", background: th.bg, color: th.ink, display: "flex", transition: "background .35s" }}>
      <style>{`.nav:hover{background:${th.panel2}!important;color:${th.ink}!important}`}</style>
      <Sidebar th={th} mode={mode} view={view} setView={setView} tr={tr} costs={data.costs} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar th={th} mode={mode} setMode={setMode} lang={lang} setLang={setLang} tr={tr} view={view} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {view === "docs" ? (
            <DocsView th={th} tr={tr} />
          ) : (
            <Placeholder th={th} tr={tr} view={view} />
          )}
        </div>
      </main>
    </div>
  );
}
