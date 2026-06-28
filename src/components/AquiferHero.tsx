"use client";

// Panel-gancho del hero: lo PRIMERO que hace el visitante es elegir su municipio
// y ver, al instante, un número real y verificable sobre SU agua (CONAGUA/DOF).
// Convierte "una herramienta que tengo que entender" en "una lectura sobre mi
// tierra" en 5 segundos. Versión compacta del AquiferLookup para el hero.

import { useState } from "react";
import Link from "next/link";
import { C, T, FONT, fz, space, radius, shadow } from "@/lib/theme";
import { CHIHUAHUA_AQUIFERS, isOverexploited, overdraftPct, deficitHm3 } from "@/lib/data/aquifers";
import { Icon } from "./Icon";

const th = T.light;
const fmt = (n: number) => Math.round(n).toLocaleString("es-MX");

export function AquiferHero() {
  const [id, setId] = useState("");
  const aq = CHIHUAHUA_AQUIFERS.find((a) => a.id === id) ?? null;

  const over = aq ? isOverexploited(aq) : false;
  const deficit = aq ? deficitHm3(aq) : 0;
  const overPct = aq ? overdraftPct(aq) : 0;
  const cutNeeded = aq ? Math.max(0, Math.round((1 - aq.recargaHm3 / aq.extraccionHm3) * 100)) : 0;
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
    <div style={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.lg, boxShadow: shadow.lg, overflow: "hidden" }}>
      <div style={{ padding: `${space.md}px ${space.lg}px`, borderBottom: `1px solid ${th.line}` }}>
        <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.md }}>El agua de tu pozo</div>
        <div style={{ fontSize: fz.xs, color: th.soft, marginTop: 2 }}>Elige tu municipio y míralo al instante · datos de CONAGUA</div>
      </div>

      <div style={{ padding: space.lg }}>
        <select
          value={id}
          onChange={(e) => setId(e.target.value)}
          aria-label="Elige tu municipio o acuífero"
          style={{ width: "100%", fontFamily: FONT.body, fontSize: fz.md, fontWeight: 600, color: id ? th.ink : th.mute, background: th.panel2, border: `1px solid ${id ? C.glacier : th.line}`, borderRadius: radius.md, padding: "13px 14px", cursor: "pointer", outline: "none" }}
        >
          <option value="">Elige tu municipio o acuífero…</option>
          {CHIHUAHUA_AQUIFERS.map((a) => (
            <option key={a.id} value={a.id}>{a.municipios} — {a.name}</option>
          ))}
        </select>

        {!aq ? (
          <div style={{ marginTop: space.md, fontSize: fz.sm, color: th.soft, lineHeight: 1.6 }}>
            Mira cuánta agua entra y sale de tu acuífero — y por qué tu pozo cada año está más hondo. <b style={{ color: th.ink }}>Sin registro.</b>
          </div>
        ) : (
          <div className="card" style={{ marginTop: space.md }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: fz.xs, fontWeight: 700, color, background: `${color}14`, border: `1px solid ${color}33`, borderRadius: radius.pill, padding: "4px 11px", marginBottom: space.md }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
              {aq.name} · {aq.status}
            </div>

            {over ? (
              <>
                <div style={{ fontSize: fz.xs, color: th.soft, marginBottom: 2 }}>Cada año se extrae</div>
                <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(40px,9vw,56px)", lineHeight: 1, color }}>
                  {overPct}%<span style={{ fontSize: "0.4em", fontWeight: 600 }}> más</span>
                </div>
                <div style={{ fontSize: fz.xs, color: th.soft, marginTop: 2 }}>agua de la que el acuífero alcanza a recargar.</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: fz.xs, color: th.soft, marginBottom: 2 }}>Tu acuífero todavía tiene</div>
                <div className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: "clamp(30px,6vw,42px)", lineHeight: 1.05, color: C.emerald }}>disponibilidad</div>
                <div style={{ fontSize: fz.xs, color: th.soft, marginTop: 2 }}>Se extrae menos de lo que se recarga.</div>
              </>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: space.sm, marginTop: space.md, padding: `${space.sm}px 0`, borderTop: `1px solid ${th.line}`, borderBottom: `1px solid ${th.line}` }}>
              {[
                { l: "Recarga", v: fmt(aq.recargaHm3), c: th.ink },
                { l: "Extrae", v: fmt(aq.extraccionHm3), c: th.ink },
                over ? { l: "Déficit", v: `−${fmt(deficit)}`, c: color } : { l: "Disp.", v: `+${fmt(aq.dmaHm3)}`, c: C.emerald },
              ].map((m) => (
                <div key={m.l}>
                  <div style={{ fontSize: fz.micro, color: th.mute }}>{m.l}</div>
                  <div className="mono" style={{ fontSize: fz.md, fontWeight: 700, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 9, color: th.mute }}>hm³/año</div>
                </div>
              ))}
            </div>

            {/* Sequía: contexto que refuerza que el déficit es estructural, no del clima */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: space.md, fontSize: fz.xs, color: th.soft }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: aq.drought.active ? C.alert : C.emerald }} />
              Sequía: <b style={{ color: aq.drought.active ? C.alert : th.ink }}>{aq.drought.label}</b> <span style={{ color: th.mute }}>· Monitor CONAGUA, jun 2026</span>
            </div>

            {over && (
              <div style={{ fontSize: fz.xs, color: th.soft, marginTop: space.sm, lineHeight: 1.5 }}>
                {aq.drought.active ? (
                  <>Y encima, sequía este año. Son <b style={{ color: th.ink }}>{fmt(deficit)} millones de m³</b> que no vuelven — tu pozo cada vez más hondo y caro de bombear.</>
                ) : (
                  <>Buen año de lluvias y <b style={{ color: th.ink }}>aun así en déficit</b>: no es el clima, es la sobreexplotación. {fmt(deficit)} millones de m³ que no vuelven cada año.</>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: space.sm, marginTop: space.md, flexWrap: "wrap" }}>
              <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.glacier, color: "#fff", fontSize: fz.sm, fontWeight: 600, padding: "10px 15px", borderRadius: radius.md, textDecoration: "none" }}>
                {over ? "Cómo ganar tiempo" : "Cómo cuidarlo"} <Icon name="arrow" size={14} color="#fff" />
              </Link>
              <button onClick={share} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#25D366", color: "#fff", border: "none", fontSize: fz.sm, fontWeight: 600, padding: "10px 15px", borderRadius: radius.md, cursor: "pointer" }}>
                <Icon name="drop" size={14} color="#fff" /> WhatsApp
              </button>
            </div>

            <div style={{ fontSize: fz.micro, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
              Fuente: CONAGUA · Disponibilidad media anual (DOF {aq.dataYear}).{" "}
              <a href={aq.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.glacier, fontWeight: 600 }}>Ver acuerdo →</a>
              <br />Sequía: Monitor de Sequía de México (CONAGUA/SMN), al 15 jun 2026; cambia cada 15 días.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
