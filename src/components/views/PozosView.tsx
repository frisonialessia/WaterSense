"use client";

import { useState } from "react";
import type { Well, AquiferNeighborhood } from "@/types/domain";
import type { PumpHealth } from "@/lib/brain/pumpHealth";
import { PUMP_DIAGNOSES } from "@/lib/brain/pumpDiagnosis";
import { C, cardStyle, fmt, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";

const STATUS_COLOR: Record<PumpHealth["status"], string> = { ok: C.emerald, warn: C.alert, critical: C.critical };
const DIAG_COLOR = { info: C.glacier, watch: C.alert, urgent: C.critical } as const;

export function PozosView({ th, tr, wells, pumps, aquifer }: { th: Theme; tr: (s: string, t: string) => string; wells: Well[]; pumps: PumpHealth[]; aquifer: AquiferNeighborhood }) {
  const byId = new Map(pumps.map((p) => [p.wellId, p]));
  const [diagId, setDiagId] = useState(PUMP_DIAGNOSES[0].id);
  const diag = PUMP_DIAGNOSES.find((d) => d.id === diagId) ?? PUMP_DIAGNOSES[0];
  const aquiferOver = aquifer.status === "Sobreexplotado";

  return (
    <div style={{ padding: space.x3, maxWidth: 920 }}>
      <div style={{ fontSize: fz.sm, color: th.mute, marginBottom: space.lg }}>
        {tr(
          "WaterSense vigila tus bombas y avisa antes de que fallen — para que no te quedes sin agua en plena temporada.",
          "Mantenimiento predictivo · monitoreo de presión y arranques por bomba."
        )}
      </div>

      {wells.map((w, i) => {
        const p = byId.get(w.id);
        if (!p) return null;
        const col = STATUS_COLOR[p.status];
        const warn = p.status !== "ok";
        return (
          <div key={w.id} className="card" style={{ ...cardStyle(th), animationDelay: `${i * 0.06}s`, padding: space.xl, marginBottom: space.md }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.lg }}>
              <div style={{ display: "flex", alignItems: "center", gap: space.md }}>
                <span style={{ width: 38, height: 38, borderRadius: radius.md, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="wrench" size={18} color={col} />
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: fz.md }}>{w.name}</div>
                  <div style={{ fontSize: fz.xs, color: warn ? C.critical : th.soft }}>{p.note}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: fz.xl, fontWeight: 700, color: col }}>{p.health}%</div>
                <div style={{ fontSize: fz.micro, color: th.mute }}>{tr("salud", "salud")}</div>
              </div>
            </div>

            <div style={{ height: 7, borderRadius: 4, background: th.panel2, overflow: "hidden", marginBottom: space.md }}>
              <div style={{ height: "100%", width: `${p.health}%`, background: col, borderRadius: 4, transition: "width .4s" }} />
            </div>

            <div style={{ display: "flex", gap: space.x2, fontSize: fz.xs, color: th.soft, flexWrap: "wrap" }}>
              <div><span style={{ color: th.mute }}>{tr("Arranques", "Arranques")}: </span><span className="mono" style={{ color: th.ink }}>{fmt(w.starts)}/{fmt(w.ratedStarts)}</span></div>
              <div><span style={{ color: th.mute }}>{tr("Vida usada", "Vida útil")}: </span><span className="mono" style={{ color: th.ink }}>{p.lifeUsedPct}%</span></div>
              <div><span style={{ color: th.mute }}>{tr("Caudal", "Flujo")}: </span><span className="mono" style={{ color: w.ok ? th.ink : C.critical }}>{fmt(w.currentFlowLph)}/{fmt(w.sustainableFlowLph)} L/h</span></div>
            </div>

            {warn && (
              <div style={{ marginTop: space.md, padding: `${space.md}px ${space.md}px`, borderRadius: radius.md, background: `${C.critical}10`, border: `1px solid ${C.critical}30`, fontSize: fz.sm, color: th.ink, lineHeight: 1.5 }}>
                {tr(
                  `Detectamos caída de presión y arranques cerca del límite. Estimamos posible falla en ${p.monthsToFailure ?? 2}–${(p.monthsToFailure ?? 2) + 2} meses. Revisa la bomba antes de la temporada alta para no perder cosecha.`,
                  `Caída de presión + arranques al ${p.lifeUsedPct}% del rated. Ventana de falla estimada: ${p.monthsToFailure ?? 2}–${(p.monthsToFailure ?? 2) + 2} meses. Mantenimiento preventivo recomendado.`
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Aquifer + nearby concessions (REPDA) */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginTop: space.md }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: space.md, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{tr("Quién comparte tu acuífero", "Acuífero y concesiones (REPDA)")}</div>
            <div style={{ fontSize: fz.xs, color: th.mute, marginTop: 2 }}>
              {aquifer.aquiferName} · {tr("aprox.", "~")} {fmt(aquifer.totalUsersAprox)} {tr("usuarios", "usuarios")} · DOF {aquifer.decreeYear}
            </div>
          </div>
          <span style={{ fontSize: fz.xs, fontWeight: 600, color: aquiferOver ? C.critical : C.emerald, background: `${aquiferOver ? C.critical : C.emerald}14`, border: `1px solid ${aquiferOver ? C.critical : C.emerald}44`, padding: "4px 11px", borderRadius: radius.pill }}>
            {aquifer.status}
          </span>
        </div>

        {aquiferOver && (
          <div style={{ marginTop: space.md, padding: `${space.sm}px ${space.md}px`, borderRadius: radius.md, background: `${C.alert}12`, border: `1px solid ${C.alert}33`, fontSize: fz.xs, color: th.ink, lineHeight: 1.5 }}>
            {tr(
              "Este acuífero está oficialmente sobreexplotado: se extrae más de lo que se recarga. Lo que saques tú y tus vecinos define cuántos años aguanta.",
              "Acuífero en veda/sobreexplotación según CONAGUA. La extracción agregada supera la recarga."
            )}
          </div>
        )}

        <div style={{ ...labelStyle(th), margin: `${space.md}px 0 ${space.sm}px` }}>{tr("Concesiones cerca de ti", "Concesiones próximas")}</div>
        {aquifer.concessions.map((c, i) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: space.md, padding: "8px 0", borderBottom: i < aquifer.concessions.length - 1 ? `1px solid ${th.line}` : "none" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: fz.sm, color: th.ink }}>{c.titular}</div>
              <div className="mono" style={{ fontSize: fz.micro, color: th.mute }}>{c.uso} · {c.distanceKm} km{c.status !== "vigente" ? ` · ${c.status}` : ""}</div>
            </div>
            <span className="mono" style={{ fontSize: fz.xs, color: th.soft }}>{fmt(c.volumeM3Year)} m³/{tr("año", "a")}</span>
          </div>
        ))}
        <p style={{ fontSize: fz.micro, color: th.mute, marginTop: space.sm, lineHeight: 1.5 }}>
          {tr(
            "Concesiones de ejemplo. La información real de quién tiene derechos de agua es pública en el REPDA de CONAGUA; aquí la estructura está lista para conectarla.",
            "Concesiones simuladas · estructura lista para REPDA (CONAGUA). Cruce por acuífero/coordenadas en Fase 4."
          )}
        </p>
      </div>

      {/* Pump troubleshooting */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginTop: space.md }}>
        <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("¿Tu bomba falla? Diagnóstico rápido", "Diagnóstico de bomba")}</div>
        <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Dinos qué notas y te decimos la causa probable y qué hacer.", "Selecciona el síntoma observado.")}</div>
        <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", marginBottom: space.md }}>
          {PUMP_DIAGNOSES.map((d) => {
            const active = d.id === diagId;
            return (
              <button key={d.id} onClick={() => setDiagId(d.id)} style={{ fontSize: fz.xs, fontWeight: 500, padding: "7px 12px", borderRadius: radius.pill, cursor: "pointer", border: `1px solid ${active ? DIAG_COLOR[d.severity] : th.line}`, background: active ? `${DIAG_COLOR[d.severity]}14` : th.panel2, color: active ? th.ink : th.soft }}>
                {tr(d.symptom, d.symptomTech)}
              </button>
            );
          })}
        </div>
        <div style={{ padding: `${space.md}px ${space.lg}px`, borderRadius: radius.md, background: th.panel2, border: `1px solid ${th.line}`, borderLeft: `3px solid ${DIAG_COLOR[diag.severity]}` }}>
          <div style={{ fontSize: fz.xs, fontWeight: 600, color: DIAG_COLOR[diag.severity], marginBottom: 6 }}>
            {diag.severity === "urgent" ? tr("Atiende pronto", "Urgente") : diag.severity === "watch" ? tr("Conviene revisar", "Revisar") : tr("Para tener en cuenta", "Info")}
          </div>
          <div style={{ fontSize: fz.sm, color: th.ink, marginBottom: 6 }}><b>{tr("Causa probable:", "Causa:")}</b> {tr(diag.cause, diag.causeTech)}</div>
          <div style={{ fontSize: fz.sm, color: th.soft }}><b style={{ color: th.ink }}>{tr("Qué hacer:", "Acción:")}</b> {diag.action}</div>
        </div>
      </div>

      <p style={{ fontSize: fz.xs, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
        {tr(
          "Datos simulados; la salud la calcula el motor (assessPump) a partir de arranques y presión. Con sensores reales por bomba, estas alertas se basarían en el desgaste medido.",
          "Datos simulados · salud calculada por el motor (assessPump). Estructura lista para sensores de presión/caudal reales por bomba."
        )}
      </p>
    </div>
  );
}
