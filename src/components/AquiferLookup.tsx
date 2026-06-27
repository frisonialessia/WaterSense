"use client";

// El "wow" del landing: el visitante elige su municipio y ve al instante el
// estado REAL de su acuífero, con las cifras OFICIALES de CONAGUA (DOF):
// cuánta agua se recarga, cuánta se extrae y el déficit en millones de m³/año.
// Convierte "un demo" en "una lectura sobre MI tierra" — y es defendible,
// porque cada número viene de la "Disponibilidad media anual de agua
// subterránea" publicada en el Diario Oficial de la Federación.
//
// Honestidad: NO proyectamos un "año exacto" en que se seca el pozo (eso
// requeriría el volumen de almacenamiento de cada acuífero, que no es público
// de forma limpia). Mostramos el sobregiro real (extracción ÷ recarga) y el
// déficit anual, que son cifras oficiales y verificables.

import { useState } from "react";
import Link from "next/link";
import { C, T, FONT, space, fz, radius, shadow } from "@/lib/theme";
import { Icon } from "./Icon";

const th = T.light;

interface Aquifer {
  id: string;
  name: string;
  municipios: string;
  /** Recarga media anual (hm³/año) — CONAGUA */
  recargaHm3: number;
  /** Volumen concesionado/extraído de agua subterránea (hm³/año) — CONAGUA */
  extraccionHm3: number;
  /** Disponibilidad media anual (hm³/año). Negativa = déficit/sobreexplotado. */
  dmaHm3: number;
  status: string;
  /** Año de la publicación oficial de los datos */
  dataYear: string;
  /** Enlace al acuerdo del DOF */
  sourceUrl: string;
}

// Cifras oficiales: "Actualización de la disponibilidad media anual de agua
// subterránea", CONAGUA, publicadas en el DOF. Todas en hm³/año (millones de
// m³/año). DMA = Recarga − Descarga natural comprometida − Volumen concesionado.
const AQUIFERS: Aquifer[] = [
  { id: "meoqui-delicias", name: "Meoqui–Delicias", municipios: "Delicias, Meoqui, Rosales, Saucillo", recargaHm3: 211.2, extraccionHm3: 383.4, dmaHm3: -172.2, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5404480&fecha=19/08/2015" },
  { id: "cuauhtemoc", name: "Cuauhtémoc", municipios: "Cuauhtémoc, Cusihuiriachi", recargaHm3: 115.2, extraccionHm3: 311.3, dmaHm3: -196.1, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5399497&fecha=06/07/2015" },
  { id: "jimenez-camargo", name: "Jiménez–Camargo", municipios: "Jiménez, Camargo", recargaHm3: 173.3, extraccionHm3: 309.9, dmaHm3: -142.1, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5404986&fecha=25/08/2015" },
  { id: "ascension", name: "Ascensión", municipios: "Ascensión", recargaHm3: 132.2, extraccionHm3: 239.2, dmaHm3: -107.0, status: "Sobreexplotado", dataYear: "2018", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5510042&fecha=04/01/2018" },
  { id: "flores-magon", name: "Flores Magón–Villa Ahumada", municipios: "Buenaventura, Villa Ahumada", recargaHm3: 137.5, extraccionHm3: 247.8, dmaHm3: -110.3, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5398033&fecha=25/06/2015" },
  { id: "casas-grandes", name: "Casas Grandes", municipios: "Nuevo Casas Grandes, Casas Grandes", recargaHm3: 180.0, extraccionHm3: 200.4, dmaHm3: -20.4, status: "Sobreexplotado", dataYear: "2018", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5510042&fecha=04/01/2018" },
  { id: "el-sauz-encinillas", name: "El Sauz–Encinillas", municipios: "Chihuahua, Riva Palacio", recargaHm3: 62.4, extraccionHm3: 90.0, dmaHm3: -27.6, status: "Sobreexplotado", dataYear: "2015", sourceUrl: "https://dof.gob.mx/nota_detalle.php?codigo=5398438&fecha=26/06/2015" },
  { id: "tabalaopa-aldama", name: "Tabalaopa–Aldama", municipios: "Chihuahua, Aldama", recargaHm3: 76.5, extraccionHm3: 60.4, dmaHm3: 11.8, status: "Con disponibilidad", dataYear: "2018", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5510042&fecha=04/01/2018" },
  { id: "alto-san-pedro", name: "Alto Río San Pedro", municipios: "Cuauhtémoc, Riva Palacio", recargaHm3: 56.3, extraccionHm3: 16.7, dmaHm3: 10.5, status: "Con disponibilidad", dataYear: "2015", sourceUrl: "https://www.dof.gob.mx/nota_detalle.php?codigo=5414725&fecha=10/11/2015" },
];

const fmt = (n: number) => Math.round(n).toLocaleString("es-MX");

export function AquiferLookup() {
  const [id, setId] = useState("");
  const aq = AQUIFERS.find((a) => a.id === id) ?? null;

  const over = aq ? aq.dmaHm3 < 0 : false;
  const deficit = aq ? Math.abs(aq.dmaHm3) : 0;
  // Sobregiro: cuánta agua de más se extrae respecto a la que se recarga.
  const overPct = aq ? Math.round((aq.extraccionHm3 / aq.recargaHm3 - 1) * 100) : 0;
  const color = !aq ? C.glacier : !over ? C.emerald : overPct >= 80 ? C.critical : C.alert;

  const share = () => {
    if (!aq) return;
    const url = typeof window !== "undefined" ? window.location.origin : "https://watersense-theta.vercel.app";
    const text = over
      ? `Mi acuífero (${aq.name}) en Chihuahua saca ${overPct}% más agua de la que se recarga — un déficit de ${fmt(deficit)} millones de m³ al año (CONAGUA). Revisa el de tu rancho en WaterSense 👉 ${url}`
      : `Mi acuífero (${aq.name}) en Chihuahua todavía tiene disponibilidad oficial (CONAGUA). Cuidarlo ahora es lo que lo mantiene así. Revisa el de tu rancho en WaterSense 👉 ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section id="tu-pozo" style={{ background: th.panel2, borderTop: `1px solid ${th.line}`, borderBottom: `1px solid ${th.line}` }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: `${space.x4}px ${space.x3}px` }}>
        <div style={{ textAlign: "center", marginBottom: space.x2 }}>
          <span className="mono" style={{ fontSize: fz.xs, color: C.emerald, fontWeight: 600, letterSpacing: ".08em" }}>DATOS OFICIALES CONAGUA · SIN REGISTRO</span>
          <h2 style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(26px,4.6vw,38px)", letterSpacing: "-0.02em", lineHeight: 1.1, margin: `${space.sm}px 0` }}>
            ¿Cómo está el acuífero de <span style={{ color: C.glacier }}>tu pozo</span>?
          </h2>
          <p style={{ fontSize: fz.md, color: th.soft, maxWidth: 580, margin: "0 auto", lineHeight: 1.6 }}>
            Elige tu municipio y mira el estado real de tu acuífero, con las cifras que CONAGUA publicó en el Diario Oficial.
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

              {over ? (
                <>
                  <div style={{ fontSize: fz.sm, color: th.soft, marginBottom: 4 }}>Cada año se extrae</div>
                  <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(44px,10vw,68px)", lineHeight: 1, color }}>
                    {overPct}%<span style={{ fontSize: "0.4em", fontWeight: 600 }}> más</span>
                  </div>
                  <div style={{ fontSize: fz.sm, color: th.soft, marginTop: 2 }}>agua de la que el acuífero alcanza a recargar.</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: fz.sm, color: th.soft, marginBottom: 4 }}>Tu acuífero todavía tiene</div>
                  <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(38px,8vw,56px)", lineHeight: 1.05, color }}>disponibilidad</div>
                  <div style={{ fontSize: fz.sm, color: th.soft, marginTop: 4 }}>Se extrae menos de lo que se recarga. Cuidarlo ahora es lo que lo mantiene así.</div>
                </>
              )}

              {/* cifras reales */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: space.sm, marginTop: space.lg, padding: `${space.md}px 0`, borderTop: `1px solid ${th.line}`, borderBottom: `1px solid ${th.line}` }}>
                {[
                  { l: "Se recarga", v: `${fmt(aq.recargaHm3)}`, u: "hm³/año", c: th.ink },
                  { l: "Se extrae", v: `${fmt(aq.extraccionHm3)}`, u: "hm³/año", c: th.ink },
                  over
                    ? { l: "Déficit", v: `−${fmt(deficit)}`, u: "hm³/año", c: color }
                    : { l: "Disponible", v: `+${fmt(aq.dmaHm3)}`, u: "hm³/año", c: C.emerald },
                ].map((m) => (
                  <div key={m.l}>
                    <div style={{ fontSize: fz.micro, color: th.mute, marginBottom: 2 }}>{m.l}</div>
                    <div className="mono" style={{ fontSize: fz.lg, fontWeight: 700, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: fz.micro, color: th.mute }}>{m.u}</div>
                  </div>
                ))}
              </div>

              {over && (
                <div style={{ fontSize: fz.sm, color: th.soft, marginTop: space.md, lineHeight: 1.5 }}>
                  Son <b style={{ color: th.ink }}>{fmt(deficit)} millones de m³</b> que no vuelven cada año: el agua queda más honda y más cara de bombear. Pero puedes <b style={{ color: C.emerald }}>ganar tiempo</b> — riego eficiente, reúso y medir lo que extraes.
                </div>
              )}

              <div style={{ display: "flex", gap: space.sm, marginTop: space.lg, flexWrap: "wrap" }}>
                <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.glacier, color: "#fff", fontSize: fz.sm, fontWeight: 600, padding: "11px 18px", borderRadius: radius.md, textDecoration: "none" }}>
                  {over ? "Ver cómo ganar tiempo" : "Ver cómo cuidarlo"} <Icon name="arrow" size={15} color="#fff" />
                </Link>
                <button onClick={share} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", border: "none", fontSize: fz.sm, fontWeight: 600, padding: "11px 18px", borderRadius: radius.md, cursor: "pointer" }}>
                  <Icon name="drop" size={15} color="#fff" /> Compartir por WhatsApp
                </button>
              </div>

              <div style={{ fontSize: fz.micro, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
                Fuente: CONAGUA · Disponibilidad media anual de agua subterránea, acuífero {aq.name} (DOF {aq.dataYear}).{" "}
                <a href={aq.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.glacier, fontWeight: 600 }}>Ver acuerdo →</a>
              </div>
            </div>
          )}

          <p style={{ fontSize: fz.micro, color: th.mute, textAlign: "center", lineHeight: 1.5 }}>
            Cifras oficiales del acuífero completo (CONAGUA/DOF). Tu pozo individual puede variar según su profundidad y zona;
            con los datos reales de tu pozo, WaterSense lo hace específico de tu rancho.
          </p>
        </div>
      </div>
    </section>
  );
}
