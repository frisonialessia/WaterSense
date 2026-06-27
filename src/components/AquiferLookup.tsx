"use client";

// El "wow" del landing: el visitante elige su municipio y ve al instante el
// estado REAL de su acuífero (sobreexplotado, según CONAGUA) y una proyección
// del año en que su pozo podría secarse — con una cifra compartible por
// WhatsApp. Convierte "un demo" en "una lectura sobre MI tierra".
//
// Acuíferos y estatus = datos públicos de Chihuahua (CONAGUA/DOF). El año es
// una proyección ilustrativa; con datos reales del pozo sería específico.

import { useState } from "react";
import Link from "next/link";
import { C, T, FONT, space, fz, radius, shadow } from "@/lib/theme";
import { Icon } from "./Icon";

const th = T.light;
const YEAR = new Date().getFullYear();

interface Aquifer {
  id: string;
  name: string;
  municipios: string;
  status: string;
  yearsLeft: number;
}

const AQUIFERS: Aquifer[] = [
  { id: "meoqui-delicias", name: "Meoqui–Delicias", municipios: "Delicias, Meoqui, Rosales, Saucillo", status: "Sobreexplotado", yearsLeft: 22 },
  { id: "jimenez-camargo", name: "Jiménez–Camargo", municipios: "Jiménez, Camargo", status: "Sobreexplotado", yearsLeft: 20 },
  { id: "cuauhtemoc", name: "Cuauhtémoc", municipios: "Cuauhtémoc, Cusihuiriachi", status: "Sobreexplotado", yearsLeft: 18 },
  { id: "alto-san-pedro", name: "Alto Río San Pedro", municipios: "Cuauhtémoc, Riva Palacio", status: "Sobreexplotado", yearsLeft: 24 },
  { id: "casas-grandes", name: "Casas Grandes", municipios: "Nuevo Casas Grandes, Casas Grandes", status: "Sobreexplotado", yearsLeft: 26 },
  { id: "ascension", name: "Ascensión", municipios: "Ascensión", status: "Sin disponibilidad", yearsLeft: 16 },
  { id: "bajio-ahumada", name: "Bajío de Ahumada", municipios: "Villa Ahumada", status: "Sin disponibilidad", yearsLeft: 15 },
  { id: "el-sauz-encinillas", name: "El Sauz–Encinillas", municipios: "Chihuahua, Riva Palacio", status: "Sobreexplotado", yearsLeft: 28 },
  { id: "tabalaopa-aldama", name: "Tabalaopa–Aldama", municipios: "Chihuahua, Aldama", status: "Sobreexplotado", yearsLeft: 30 },
  { id: "flores-magon", name: "Flores Magón–Villa Ahumada", municipios: "Buenaventura, Villa Ahumada", status: "Sobreexplotado", yearsLeft: 17 },
  { id: "otro", name: "Mi acuífero", municipios: "No lo sé / otro municipio", status: "Bajo presión", yearsLeft: 25 },
];

export function AquiferLookup() {
  const [id, setId] = useState("");
  const aq = AQUIFERS.find((a) => a.id === id) ?? null;
  const limitYear = aq ? YEAR + aq.yearsLeft : null;
  const critical = aq ? /sin disponibilidad/i.test(aq.status) || aq.yearsLeft <= 18 : false;
  const color = critical ? C.critical : C.alert;

  const share = () => {
    if (!aq) return;
    const url = typeof window !== "undefined" ? window.location.origin : "https://watersense-theta.vercel.app";
    const text = `Mi acuífero (${aq.name}) está ${aq.status.toLowerCase()} en Chihuahua. A este ritmo, mi pozo podría dejar de dar agua hacia ${limitYear}. Calcula el de tu rancho en WaterSense 👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="tu-pozo" style={{ background: th.panel2, borderTop: `1px solid ${th.line}`, borderBottom: `1px solid ${th.line}` }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${space.x4}px ${space.x3}px` }}>
        <div style={{ textAlign: "center", marginBottom: space.x2 }}>
          <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".08em" }}>EN 10 SEGUNDOS · SIN REGISTRO</span>
          <h2 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(26px,4.6vw,38px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: `${space.sm}px 0` }}>
            ¿Cuántos años le quedan a <span style={{ color: C.glacier }}>tu pozo</span>?
          </h2>
          <p style={{ fontSize: fz.md, color: th.soft, maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>
            Elige tu municipio y mira el estado real de tu acuífero — y hasta cuándo aguantaría tu pozo si nada cambia.
          </p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: space.md }}>
          <select
            value={id}
            onChange={(e) => setId(e.target.value)}
            aria-label="Elige tu municipio o acuífero"
            style={{ width: "100%", fontFamily: FONT.body, fontSize: fz.md, fontWeight: 600, color: id ? th.ink : th.mute, background: th.panel, border: `1px solid ${id ? C.glacier : th.line}`, borderRadius: radius.md, padding: "14px 16px", cursor: "pointer", outline: "none", boxShadow: shadow.sm }}
          >
            <option value="">Elige tu municipio o acuífero…</option>
            {AQUIFERS.map((a) => (
              <option key={a.id} value={a.id}>{a.municipios} — {a.name}</option>
            ))}
          </select>

          {aq && (
            <div className="card" style={{ background: th.panel, border: `1px solid ${color}40`, borderLeft: `4px solid ${color}`, borderRadius: radius.lg, padding: space.x2, boxShadow: shadow.md }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: fz.xs, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}33`, borderRadius: radius.pill, padding: "4px 11px", marginBottom: space.md }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                {aq.name} · {aq.status}
              </div>
              <div style={{ fontSize: fz.sm, color: th.soft, marginBottom: 4 }}>Si nada cambia, tu pozo podría dejar de dar agua hacia</div>
              <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(48px,11vw,72px)", lineHeight: 1, color }}>{limitYear}</div>
              <div style={{ fontSize: fz.sm, color: th.soft, marginTop: space.sm, lineHeight: 1.5 }}>
                Faltan <b style={{ color: th.ink }}>{aq.yearsLeft} años</b>. Pero puedes <b style={{ color: C.emerald }}>ganar más</b> — riego eficiente, reúso y cuidar el acuífero.
              </div>
              <div style={{ display: "flex", gap: space.sm, marginTop: space.lg, flexWrap: "wrap" }}>
                <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.glacier, color: "#fff", fontSize: fz.sm, fontWeight: 600, padding: "11px 18px", borderRadius: radius.md, textDecoration: "none" }}>
                  Ver cómo ganar años <Icon name="arrow" size={15} color="#fff" />
                </Link>
                <button onClick={share} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", border: "none", fontSize: fz.sm, fontWeight: 600, padding: "11px 18px", borderRadius: radius.md, cursor: "pointer" }}>
                  <Icon name="drop" size={15} color="#fff" /> Compartir por WhatsApp
                </button>
              </div>
            </div>
          )}

          <p style={{ fontSize: fz.micro, color: th.mute, textAlign: "center", lineHeight: 1.5 }}>
            Estado del acuífero según CONAGUA (DOF). El año es una proyección ilustrativa; con los datos reales de tu pozo sería específico de tu rancho.
          </p>
        </div>
      </div>
    </section>
  );
}
