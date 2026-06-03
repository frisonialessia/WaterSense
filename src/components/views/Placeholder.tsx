"use client";

// Honest placeholder for views still being migrated from the HTML prototype.
// Each will be replaced by its real component in the next migration steps.

import { C, type Theme } from "@/lib/theme";
import type { ViewId } from "../Sidebar";

const LABELS: Record<ViewId, string> = {
  finca: "Mi finca",
  mapa: "Mapa del campo",
  costos: "Costos",
  futuro: "Futuro del agua",
  pozos: "Mis pozos",
  docs: "Ayuda",
};

export function Placeholder({ th, tr, view }: { th: Theme; tr: (s: string, t: string) => string; view: ViewId }) {
  return (
    <div style={{ padding: 30, maxWidth: 760 }}>
      <div
        className="card"
        style={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: 16, padding: "28px 30px" }}
      >
        <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: C.glacier, background: `${C.glacier}14`, border: `1px solid ${C.glacier}33`, padding: "4px 11px", borderRadius: 999, marginBottom: 14 }}>
          {tr("En migración", "En migración")}
        </span>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>{LABELS[view]}</h2>
        <p style={{ fontSize: 13.5, color: th.soft, lineHeight: 1.6 }}>
          {tr(
            "Esta vista se está migrando desde el prototipo. Ya puedes navegar por la app y ver la vista de Ayuda terminada.",
            "Vista pendiente de migración desde el prototipo HTML. La navegación y la vista Ayuda ya están operativas."
          )}
        </p>
      </div>
    </div>
  );
}
