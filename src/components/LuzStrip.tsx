"use client";

// Franja del landing: hace concreta la otra mitad de la promesa ("paga menos
// luz"). Trae el precio de la luz hora-a-hora (CENACE en vivo vía /api/tariff,
// con respaldo simulado) y muestra la hora más barata para bombear y cuánto
// más cara es la hora pico. Dato real, sin integrar nada nuevo.

import { useEffect, useMemo, useState } from "react";
import { C, T, FONT, fz, space, radius } from "@/lib/theme";

const th = T.light;

// Curva estimada de arranque (forma típica del precio spot agrícola en
// Chihuahua: barata de madrugada, cara a media tarde). Se muestra de
// inmediato — etiquetada "estimado" — y se reemplaza por CENACE en vivo
// cuando /api/tariff responde, para no dejar un "cargando" de varios segundos.
const SEED_CURVE = [
  0.72, 0.66, 0.62, 0.6, 0.61, 0.68, 0.85, 1.05, 1.2, 1.25, 1.3, 1.45,
  1.6, 1.78, 1.95, 2.05, 2.1, 2.15, 2.2, 2.1, 1.8, 1.4, 1.05, 0.85,
];

export function LuzStrip() {
  const [curve, setCurve] = useState<number[]>(SEED_CURVE);
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    fetch("/api/tariff", { signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.curve) && d.curve.length === 24) {
          setCurve(d.curve);
          setSource(d.source ?? "");
        }
      })
      .catch(() => {});
  }, []);

  const { cheapest, peak, min, max, savingPct } = useMemo(() => {
    const min = Math.min(...curve);
    const max = Math.max(...curve);
    return {
      cheapest: curve.indexOf(min),
      peak: curve.indexOf(max),
      min,
      max,
      savingPct: max > 0 ? Math.round((1 - min / max) * 100) : 0,
    };
  }, [curve]);

  const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

  return (
    <section style={{ background: th.panel, borderBottom: `1px solid ${th.line}` }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${space.x3}px ${space.x3}px` }}>
        <div style={{ textAlign: "center", marginBottom: space.lg }}>
          <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".08em" }}>
            Y CUANDO RIEGAS · LUZ EN VIVO
          </span>
          <h2 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(24px,4.2vw,34px)", letterSpacing: "-0.02em", lineHeight: 1.12, margin: `${space.sm}px 0 0` }}>
            Te decimos <span style={{ color: C.glacier }}>a qué hora</span> sale más barato bombear
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: space.x2, alignItems: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.lg, padding: space.x2 }} className="luz-grid">
          {/* cifra */}
          <div>
            <div style={{ fontSize: fz.xs, color: th.soft, marginBottom: 4 }}>La hora más barata para regar hoy</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: space.sm }}>
              <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(30px,6vw,46px)", lineHeight: 1, color: C.emerald }}>{hh(cheapest)}</span>
              <span className="mono" style={{ fontSize: fz.lg, fontWeight: 700, color: th.ink }}>${min.toFixed(2)}<span style={{ fontSize: fz.xs, color: th.mute, fontWeight: 500 }}>/kWh</span></span>
            </div>
            <div style={{ fontSize: fz.sm, color: th.soft, marginTop: space.sm, lineHeight: 1.5 }}>
              A las <b style={{ color: th.ink }}>{hh(peak)}</b> cuesta <b style={{ color: C.critical }}>${max.toFixed(2)}</b> — hasta <b style={{ color: C.emerald }}>{savingPct}% más caro</b>. Mismos litros, menos pesos de luz.
            </div>
            <div style={{ fontSize: fz.micro, color: th.mute, marginTop: space.md }}>
              {source === "cenace" ? "Precio CENACE en vivo · nodo Chihuahua" : source === "sim" ? "Precio estimado (CENACE no disponible ahora)" : "Precio estimado"} · $/kWh
            </div>
          </div>

          {/* sparkline 24h */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 96 }}>
            {curve.map((p, h) => (
              <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div
                  style={{
                    width: "100%",
                    height: `${max > 0 ? (p / max) * 74 : 4}px`,
                    minHeight: 3,
                    borderRadius: "3px 3px 0 0",
                    background: h === cheapest ? C.emerald : h === peak ? C.critical : th.line,
                    transition: "height .3s ease, background .3s ease",
                  }}
                />
                <span className="mono" style={{ fontSize: 8, color: h % 6 === 0 ? th.soft : "transparent" }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
