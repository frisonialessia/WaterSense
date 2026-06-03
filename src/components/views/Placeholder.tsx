"use client";

// Honest placeholder for views still being migrated from the HTML prototype.
// Each will be replaced by its real component in the next migration steps.

import { C, cardStyle, space, fz, radius, type Theme } from "@/lib/theme";
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
    <div style={{ padding: space.x3, maxWidth: 760 }}>
      <div className="card" style={{ ...cardStyle(th), padding: `${space.x2}px ${space.x3}px` }}>
        <span
          style={{
            display: "inline-block",
            fontSize: fz.micro,
            fontWeight: 600,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: C.glacier,
            background: `${C.glacier}12`,
            border: `1px solid ${C.glacier}33`,
            padding: "3px 10px",
            borderRadius: radius.pill,
            marginBottom: space.md,
          }}
        >
          {tr("En migración", "En migración")}
        </span>
        <h2 style={{ fontSize: fz.lg, fontWeight: 600, marginBottom: space.sm }}>{LABELS[view]}</h2>
        <p style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.6 }}>
          {tr(
            "Esta vista se está migrando al nuevo diseño. Ya puedes navegar por la app y ver la vista de Ayuda terminada.",
            "Vista pendiente de migración al nuevo sistema de diseño. Navegación y vista Ayuda operativas."
          )}
        </p>
      </div>
    </div>
  );
}
