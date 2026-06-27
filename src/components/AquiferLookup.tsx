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
import { CHIHUAHUA_AQUIFERS, isOverexploited, overdraftPct, deficitHm3 } from "@/lib/data/aquifers";
import { Icon } from "./Icon";

const th = T.light;

const fmt = (n: number) => Math.round(n).toLocaleString("es-MX");

export function AquiferLookup() {
  const [id, setId] = useState("");
  const aq = CHIHUAHUA_AQUIFERS.find((a) => a.id === id) ?? null;

  const over = aq ? isOverexploited(aq) : false;
  const deficit = aq ? deficitHm3(aq) : 0;
  // Sobregiro: cuánta agua de más se extrae respecto a la que se recarga.
  const overPct = aq ? overdraftPct(aq) : 0;
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
            {CHIHUAHUA_AQUIFERS.map((a) => (
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
