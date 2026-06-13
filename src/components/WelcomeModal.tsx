"use client";

// Bienvenida de una sola vez al entrar a la demo: orienta al visitante (qué es
// y qué explorar) para que entienda el valor en segundos. Se marca como vista
// en localStorage; reiniciar la demo la vuelve a mostrar.
import { useEffect, useState } from "react";
import { C, FONT, space, fz, radius, shadow, type Theme } from "@/lib/theme";
import { Logo } from "./Logo";
import { Icon } from "./Icon";

const KEY = "watersense.welcomed";

export function WelcomeModal({ th, tr }: { th: Theme; tr: (s: string, t: string) => string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);
  if (!open) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const points: { icon: string; t: string }[] = [
    { icon: "coin", t: tr("Tu decisión de hoy: qué regar y cuánto ahorras.", "Decisión de hoy: riego óptimo y ahorro.") },
    { icon: "chart", t: tr("Mueve el «Futuro del agua» y mira cuántos años le quedan a tu pozo.", "Futuro del agua: proyección del acuífero.") },
    { icon: "drop", t: tr("Registra un riego y controla tu concesión.", "Bitácora de riego + control de concesión.") },
  ];

  return (
    <div
      onClick={close}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(8,26,35,.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: space.lg }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 460, background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.lg, boxShadow: shadow.lg, padding: space.x2, fontFamily: FONT.body }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: space.sm, marginBottom: space.lg }}>
          <Logo size={30} animated={false} />
          <b style={{ fontFamily: FONT.title, fontSize: fz.md }}>WaterSense</b>
          <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: C.glacier, border: `1px solid ${C.glacier}44`, borderRadius: radius.sm, padding: "2px 5px" }}>DEMO</span>
        </div>

        <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, letterSpacing: "-0.01em", marginBottom: space.sm }}>
          {tr("Estás viendo una demostración", "Demostración interactiva")}
        </div>
        <p style={{ fontSize: fz.sm, color: th.soft, lineHeight: 1.6, marginBottom: space.lg }}>
          {tr(
            "Un rancho de ejemplo en Delicias, Chihuahua, con datos simulados (rangos reales). Lo que edites se guarda solo en tu navegador.",
            "Rancho de ejemplo · datos simulados con rangos reales de Chihuahua. Tus cambios viven en este navegador.",
          )}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: space.md, marginBottom: space.x2 }}>
          {points.map((p) => (
            <div key={p.t} style={{ display: "flex", gap: space.md, alignItems: "center" }}>
              <span style={{ width: 34, height: 34, borderRadius: radius.md, background: `${C.emerald}14`, border: `1px solid ${C.emerald}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={p.icon} size={16} color={C.emerald} />
              </span>
              <span style={{ fontSize: fz.sm, color: th.ink, lineHeight: 1.5 }}>{p.t}</span>
            </div>
          ))}
        </div>

        <button
          onClick={close}
          style={{ width: "100%", border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "12px 0", fontSize: fz.md, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          {tr("Explorar la demo", "Explorar")} <Icon name="arrow" size={16} color="#fff" />
        </button>
        <p style={{ fontSize: fz.micro, color: th.mute, textAlign: "center", marginTop: space.md }}>
          {tr("Puedes reiniciar la demo cuando quieras desde el panel lateral.", "Reinicia la demo desde el panel lateral.")}
        </p>
      </div>
    </div>
  );
}
