"use client";

import { useState } from "react";
import type { Well, AquiferNeighborhood } from "@/types/domain";
import type { PumpHealth } from "@/lib/brain/pumpHealth";
import { PUMP_DIAGNOSES } from "@/lib/brain/pumpDiagnosis";
import { C, cardStyle, fmt, space, fz, radius, labelStyle, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";

const STATUS_COLOR: Record<PumpHealth["status"], string> = { ok: C.emerald, warn: C.alert, critical: C.critical };
const DIAG_COLOR = { info: C.glacier, watch: C.alert, urgent: C.critical } as const;

export function PozosView({
  th,
  tr,
  wells,
  pumps,
  aquifer,
  onUpdate,
  onAdd,
  onRemove,
}: {
  th: Theme;
  tr: (s: string, t: string) => string;
  wells: Well[];
  pumps: PumpHealth[];
  aquifer: AquiferNeighborhood;
  onUpdate: (id: string, patch: Partial<Well>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const byId = new Map(pumps.map((p) => [p.wellId, p]));
  const [diagId, setDiagId] = useState(PUMP_DIAGNOSES[0].id);
  const [selId, setSelId] = useState<string>(wells[0]?.id ?? "");
  const [editId, setEditId] = useState<string | null>(null);
  const diag = PUMP_DIAGNOSES.find((d) => d.id === diagId) ?? PUMP_DIAGNOSES[0];
  const aquiferOver = aquifer.status === "Sobreexplotado";
  const selWell = wells.find((w) => w.id === selId) ?? wells[0];
  // Neighbor alert: a nearby concession dropping its water table unusually fast.
  const neighborAlerts = aquifer.concessions.filter((c) => (c.levelTrendMPerYear ?? 0) <= -2.0);

  const numInput: React.CSSProperties = { width: "100%", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.sm, padding: "6px 8px", color: th.ink, fontSize: fz.xs, outline: "none", fontFamily: "inherit" };
  const iconBtn: React.CSSProperties = { width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.sm, cursor: "pointer", color: th.soft, padding: 0 };

  return (
    <div style={{ padding: space.x3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: space.md, marginBottom: space.lg, flexWrap: "wrap" }}>
        <div style={{ fontSize: fz.sm, color: th.mute, maxWidth: 620 }}>
          {tr(
            "WaterSense vigila tus bombas y avisa antes de que fallen. Toca un pozo para verlo en el acuífero, edita sus datos o agrega los que falten.",
            "Mantenimiento predictivo. Selecciona un pozo para el acuífero; edita o agrega pozos."
          )}
        </div>
        <button onClick={onAdd} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "9px 16px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
          + {tr("Agregar pozo", "Agregar pozo")}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 440px),1fr))", gap: space.md, marginBottom: space.md }}>
        {wells.map((w, i) => {
          const p = byId.get(w.id);
          if (!p) return null;
          const col = STATUS_COLOR[p.status];
          const warn = p.status !== "ok";
          const selected = w.id === selId;
          const editing = editId === w.id;
          return (
            <div
              key={w.id}
              className="card"
              onClick={() => setSelId(w.id)}
              style={{ ...cardStyle(th), animationDelay: `${i * 0.05}s`, padding: space.xl, cursor: "pointer", border: `1px solid ${selected ? C.glacier : th.line}`, boxShadow: selected ? `0 0 0 1px ${C.glacier}` : undefined }}
            >
              {editing ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <div style={{ ...labelStyle(th), marginBottom: space.sm }}>{tr("Editar pozo", "Editar pozo")}</div>
                  <input value={w.name} onChange={(e) => onUpdate(w.id, { name: e.target.value })} placeholder={tr("Nombre", "Nombre")} style={{ ...numInput, marginBottom: 6 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                    <label style={{ fontSize: fz.micro, color: th.soft }}>{tr("Caudal actual L/h", "Q actual")}<input type="number" value={w.currentFlowLph} onChange={(e) => onUpdate(w.id, { currentFlowLph: +e.target.value })} style={numInput} /></label>
                    <label style={{ fontSize: fz.micro, color: th.soft }}>{tr("Caudal sostenible L/h", "Q sostenible")}<input type="number" value={w.sustainableFlowLph} onChange={(e) => onUpdate(w.id, { sustainableFlowLph: +e.target.value })} style={numInput} /></label>
                    <label style={{ fontSize: fz.micro, color: th.soft }}>{tr("Profundidad m", "Prof. m")}<input type="number" value={w.depthM} onChange={(e) => onUpdate(w.id, { depthM: +e.target.value })} style={numInput} /></label>
                    <label style={{ fontSize: fz.micro, color: th.soft }}>{tr("Arranques", "Arranques")}<input type="number" value={w.starts} onChange={(e) => onUpdate(w.id, { starts: +e.target.value })} style={numInput} /></label>
                  </div>
                  <button onClick={() => setEditId(null)} style={{ border: "none", background: C.emerald, color: "#fff", borderRadius: radius.md, padding: "7px 16px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>{tr("Listo", "Listo")}</button>
                </div>
              ) : (
                <>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setEditId(w.id)} aria-label={tr("Editar", "Editar")} title={tr("Editar", "Editar")} style={iconBtn}><Icon name="sliders" size={14} color={th.soft} /></button>
                      <button onClick={() => { if (wells.length > 1) onRemove(w.id); }} aria-label={tr("Quitar", "Quitar")} title={tr("Quitar", "Quitar")} style={{ ...iconBtn, fontSize: 13, lineHeight: 1 }}>🗑</button>
                      <div style={{ textAlign: "right", marginLeft: 6 }}>
                        <div className="mono" style={{ fontSize: fz.xl, fontWeight: 700, color: col }}>{p.health}%</div>
                        <div style={{ fontSize: fz.micro, color: th.mute }}>{tr("salud", "salud")}</div>
                      </div>
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
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Aquifer + nearby concessions (REPDA) — reflects the selected well */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginTop: space.md }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: space.md, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{tr("Quién comparte tu acuífero", "Acuífero y concesiones (REPDA)")}</div>
            <div style={{ fontSize: fz.xs, color: th.mute, marginTop: 2 }}>
              {selWell && <b style={{ color: C.glacier }}>{selWell.name}</b>}{selWell ? " · " : ""}{aquifer.aquiferName} · {tr("aprox.", "~")} {fmt(aquifer.totalUsersAprox)} {tr("usuarios", "usuarios")} · DOF {aquifer.decreeYear}
            </div>
          </div>
          <span style={{ fontSize: fz.xs, fontWeight: 600, color: aquiferOver ? C.critical : C.emerald, background: `${aquiferOver ? C.critical : C.emerald}14`, border: `1px solid ${aquiferOver ? C.critical : C.emerald}44`, padding: "4px 11px", borderRadius: radius.pill }}>
            {aquifer.status}
          </span>
        </div>

        {selWell && (
          <div style={{ marginTop: space.md, display: "flex", gap: space.x2, fontSize: fz.xs, color: th.soft, flexWrap: "wrap" }}>
            <div><span style={{ color: th.mute }}>{tr("Profundidad", "Prof.")}: </span><span className="mono" style={{ color: th.ink }}>{selWell.depthM} m</span></div>
            <div><span style={{ color: th.mute }}>{tr("Extracción", "Q")}: </span><span className="mono" style={{ color: selWell.ok ? th.ink : C.critical }}>{fmt(selWell.currentFlowLph)} L/h</span></div>
            <div><span style={{ color: th.mute }}>{tr("Sostenible", "Sost.")}: </span><span className="mono" style={{ color: th.ink }}>{fmt(selWell.sustainableFlowLph)} L/h</span></div>
          </div>
        )}

        {aquiferOver && (
          <div style={{ marginTop: space.md, padding: `${space.sm}px ${space.md}px`, borderRadius: radius.md, background: `${C.alert}12`, border: `1px solid ${C.alert}33`, fontSize: fz.xs, color: th.ink, lineHeight: 1.5 }}>
            {tr(
              "Este acuífero está oficialmente sobreexplotado: se extrae más de lo que se recarga. Lo que saques tú y tus vecinos define cuántos años aguanta.",
              "Acuífero en veda/sobreexplotación según CONAGUA. La extracción agregada supera la recarga."
            )}
          </div>
        )}

        {neighborAlerts.length > 0 && (
          <div style={{ marginTop: space.md, padding: `${space.md}px ${space.lg}px`, borderRadius: radius.md, background: `${C.critical}12`, border: `1px solid ${C.critical}40`, display: "flex", alignItems: "flex-start", gap: space.md }}>
            <span style={{ width: 30, height: 30, borderRadius: radius.md, background: `${C.critical}1f`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="drop" size={16} color={C.critical} />
            </span>
            <div style={{ fontSize: fz.sm, color: th.ink, lineHeight: 1.5 }}>
              <b>{tr("Alerta de vecinos", "Alerta de vecinos")}:</b>{" "}
              {tr(
                `${neighborAlerts[0].titular} (a ${neighborAlerts[0].distanceKm} km) muestra un descenso inusual del nivel (${neighborAlerts[0].levelTrendMPerYear} m/año). Posible sobreextracción cercana — conviene repartir tu bombeo y vigilar tu propio nivel.`,
                `${neighborAlerts[0].titular}: abatimiento ${neighborAlerts[0].levelTrendMPerYear} m/año (anómalo) a ${neighborAlerts[0].distanceKm} km. Riesgo de interferencia de pozos.`
              )}
            </div>
          </div>
        )}

        <div style={{ ...labelStyle(th), margin: `${space.md}px 0 ${space.sm}px` }}>{tr("Concesiones cerca de ti", "Concesiones próximas")}</div>
        {aquifer.concessions.map((c, i) => {
          const trend = c.levelTrendMPerYear ?? 0;
          const trendColor = trend <= -2 ? C.critical : trend <= -1.2 ? C.alert : C.emerald;
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: space.md, padding: "8px 0", borderBottom: i < aquifer.concessions.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: fz.sm, color: th.ink }}>{c.titular}</div>
                <div className="mono" style={{ fontSize: fz.micro, color: th.mute }}>{c.uso} · {c.distanceKm} km{c.status !== "vigente" ? ` · ${c.status}` : ""}</div>
              </div>
              <span className="mono" style={{ fontSize: fz.micro, fontWeight: 600, color: trendColor }} title={tr("descenso del nivel freático", "tendencia nivel")}>
                {trend > 0 ? "↑" : "↓"} {Math.abs(trend)} m/{tr("año", "a")}
              </span>
              <span className="mono" style={{ fontSize: fz.xs, color: th.soft }}>{fmt(c.volumeM3Year)} m³/{tr("año", "a")}</span>
            </div>
          );
        })}
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
          "Datos simulados; la salud la calcula el motor (assessPump) a partir de arranques y presión. Tus cambios se guardan en tu navegador.",
          "Datos simulados · salud calculada por el motor (assessPump). Los cambios se guardan en localStorage."
        )}
      </p>
    </div>
  );
}
