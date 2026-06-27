"use client";

// Panel interactivo del hero: el visitante elige su acuífero (datos REALES de
// CONAGUA) y mueve la extracción de la región para ver el BALANCE del agua —
// cuánta entra (recarga) vs cuánta sale (extracción) — y cuánto habría que
// bajar para llegar al equilibrio. No proyecta un "año" inventado: muestra el
// déficit real en hm³/año y cómo se cierra. Honesto y verificable.

import { useState } from "react";
import { CHIHUAHUA_AQUIFERS, overdraftPct } from "@/lib/data/aquifers";
import { C, T, FONT, fz, space, radius, shadow } from "@/lib/theme";

const th = T.light;
const fmt = (n: number) => Math.round(n).toLocaleString("es-MX");

// Acuífero de arranque: Meoqui–Delicias, el corazón agrícola de Chihuahua
// (nogal, chile, alfalfa) y uno de los más sobreexplotados.
const DEFAULT_ID = "meoqui-delicias";

export function HeroSimulator() {
  const [id, setId] = useState(DEFAULT_ID);
  const [pct, setPct] = useState(100); // extracción de la región, % vs hoy

  const aq = CHIHUAHUA_AQUIFERS.find((a) => a.id === id) ?? CHIHUAHUA_AQUIFERS[0];
  const extraccion = (aq.extraccionHm3 * pct) / 100;
  const balance = aq.recargaHm3 - extraccion; // + = se recupera, − = déficit
  const enEquilibrio = balance >= 0;
  // Cuánto tendría que bajar la región (desde HOY) para dejar de vaciar el pozo.
  const cutNeeded = Math.max(0, Math.round((1 - aq.recargaHm3 / aq.extraccionHm3) * 100));
  const color = enEquilibrio ? C.emerald : overdraftPct(aq) >= 80 && pct >= 100 ? C.critical : C.alert;

  // Barras: recarga fija como referencia; la extracción escala con el slider.
  const maxRef = Math.max(aq.recargaHm3, aq.extraccionHm3 * 1.2);
  const wRecarga = (aq.recargaHm3 / maxRef) * 100;
  const wExtrae = (extraccion / maxRef) * 100;

  return (
    <div style={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.lg, boxShadow: shadow.lg, overflow: "hidden" }}>
      <div style={{ padding: `${space.md}px ${space.lg}px`, borderBottom: `1px solid ${th.line}` }}>
        <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.md }}>El agua de tu región</div>
        <div style={{ fontSize: fz.xs, color: th.soft, marginTop: 2 }}>Mueve la extracción y mira el balance del acuífero</div>
      </div>

      <div style={{ padding: space.lg }}>
        {/* selector de acuífero */}
        <select
          value={id}
          onChange={(e) => { setId(e.target.value); setPct(100); }}
          aria-label="Elige tu acuífero"
          style={{ width: "100%", fontFamily: FONT.body, fontSize: fz.sm, fontWeight: 600, color: th.ink, background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: "9px 12px", cursor: "pointer", outline: "none", marginBottom: space.md }}
        >
          {CHIHUAHUA_AQUIFERS.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* resultado */}
        <div style={{ display: "flex", alignItems: "baseline", gap: space.sm, marginBottom: space.md }}>
          {enEquilibrio ? (
            <>
              <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: C.emerald }}>En equilibrio</span>
              <span style={{ fontSize: fz.xs, color: th.soft }}>el acuífero se mantiene</span>
            </>
          ) : (
            <>
              <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color }}>−{fmt(-balance)} hm³</span>
              <span style={{ fontSize: fz.xs, color: th.soft }}>de déficit al año</span>
            </>
          )}
        </div>

        {/* barras recarga vs extracción */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: space.md }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: fz.micro, color: th.mute, marginBottom: 3 }}>
              <span>Se recarga</span><span className="mono">{fmt(aq.recargaHm3)} hm³</span>
            </div>
            <div style={{ height: 9, background: th.panel2, borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${wRecarga}%`, height: "100%", background: C.glacier, borderRadius: 5 }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: fz.micro, color: th.mute, marginBottom: 3 }}>
              <span>Se extrae</span><span className="mono" style={{ color }}>{fmt(extraccion)} hm³</span>
            </div>
            <div style={{ height: 9, background: th.panel2, borderRadius: 5, overflow: "hidden", position: "relative" }}>
              {/* marca de la recarga, para ver cuándo la extracción la rebasa */}
              <div style={{ position: "absolute", left: `${wRecarga}%`, top: -2, bottom: -2, width: 2, background: C.glacier, opacity: 0.5 }} />
              <div style={{ width: `${wExtrae}%`, height: "100%", background: color, borderRadius: 5, transition: "width .12s ease" }} />
            </div>
          </div>
        </div>

        {/* slider */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span style={{ fontSize: fz.xs, color: th.ink, fontWeight: 500 }}>Extracción de la región</span>
          <span className="mono" style={{ fontSize: fz.sm, fontWeight: 700, color }}>{pct}%</span>
        </div>
        <input type="range" min={40} max={120} value={pct} onChange={(e) => setPct(+e.target.value)} style={{ width: "100%", accentColor: C.glacier, cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: th.mute, marginBottom: space.md }}>
          <span>se recupera</span>
          <span>como hoy</span>
        </div>

        {/* insight honesto */}
        <div style={{ fontSize: fz.xs, color: th.soft, lineHeight: 1.5, background: th.panel2, borderRadius: radius.md, padding: `${space.sm}px ${space.md}px` }}>
          {cutNeeded > 0 ? (
            <>Para que <b style={{ color: th.ink }}>{aq.name}</b> deje de vaciarse, la región tendría que extraer <b style={{ color: C.glacier }}>{cutNeeded}% menos</b>. Tú solo no lo decides — pero cada gota que ahorras hace que tu pozo dure más.</>
          ) : (
            <><b style={{ color: th.ink }}>{aq.name}</b> todavía tiene disponibilidad oficial. Cuidarlo ahora es lo que lo mantiene así.</>
          )}
        </div>
        <div style={{ fontSize: 10, color: th.mute, marginTop: space.sm, textAlign: "right" }}>Recarga y extracción: CONAGUA · DOF {aq.dataYear}</div>
      </div>
    </div>
  );
}
