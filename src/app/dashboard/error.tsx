"use client";

// Graceful error boundary for the dashboard route. Keeps the demo from
// showing a raw Next.js error if a data source hiccups.
import { useEffect } from "react";
import { T, C, space, fz, radius, FONT } from "@/lib/theme";

const th = T.light;

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: th.bg, padding: space.x3, fontFamily: FONT.body }}>
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: th.ink, marginBottom: space.sm }}>Algo no cargó bien</div>
        <p style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.6, marginBottom: space.lg }}>
          Tuvimos un problema al preparar tu panel. Suele ser temporal —vuelve a intentarlo. Si sigue, recarga la página.
        </p>
        <div style={{ display: "flex", gap: space.sm, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={reset} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 20px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer" }}>
            Reintentar
          </button>
          <a href="/" style={{ background: th.panel2, border: `1px solid ${th.line}`, color: th.ink, borderRadius: radius.md, padding: "10px 20px", fontSize: fz.sm, fontWeight: 600, textDecoration: "none" }}>
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
