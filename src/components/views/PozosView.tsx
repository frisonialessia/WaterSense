"use client";

import { useEffect, useState } from "react";
import type { Well, AquiferNeighborhood, WaterConcession, Reading } from "@/types/domain";
import type { PumpHealth } from "@/lib/brain/pumpHealth";
import { PUMP_DIAGNOSES } from "@/lib/brain/pumpDiagnosis";
import { buildAlerts, alertsToMessage } from "@/lib/brain/alerts";
import { LocalRepository } from "@/lib/data/LocalRepository";

// Backend local sin nube: las lecturas que captura el productor viven en
// localStorage a través del contrato FarmRepository (mismo seam que Supabase).
const localRepo = new LocalRepository();

// Métricas capturables. Las que mapean a un campo del pozo recalculan su salud.
const READING_METRICS: { key: string; label: string; tech: string; unit: string; field?: keyof Well }[] = [
  { key: "nivel_m", label: "Nivel del pozo", tech: "Nivel dinámico", unit: "m" },
  { key: "arranques", label: "Arranques (acumulado)", tech: "Arranques", unit: "", field: "starts" },
  { key: "caudal_lph", label: "Caudal medido", tech: "Q", unit: "L/h", field: "currentFlowLph" },
  { key: "kwh", label: "Consumo eléctrico", tech: "Energía", unit: "kWh" },
];
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
  onAddConcession,
  onRemoveConcession,
}: {
  th: Theme;
  tr: (s: string, t: string) => string;
  wells: Well[];
  pumps: PumpHealth[];
  aquifer: AquiferNeighborhood;
  onUpdate: (id: string, patch: Partial<Well>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onAddConcession: (c: WaterConcession) => void;
  onRemoveConcession: (id: string) => void;
}) {
  const byId = new Map(pumps.map((p) => [p.wellId, p]));
  const [diagId, setDiagId] = useState(PUMP_DIAGNOSES[0].id);
  const [selId, setSelId] = useState<string>(wells[0]?.id ?? "");
  const [editId, setEditId] = useState<string | null>(null);
  const [addingNb, setAddingNb] = useState(false);
  const [nb, setNb] = useState<{ titular: string; uso: WaterConcession["uso"]; volumeM3Year: string; distanceKm: string; levelTrendMPerYear: string; status: WaterConcession["status"] }>({ titular: "", uso: "Agrícola", volumeM3Year: "", distanceKm: "", levelTrendMPerYear: "", status: "vigente" });
  const saveNb = () => {
    if (!nb.titular.trim()) return;
    onAddConcession({
      id: `nb-${Date.now()}`,
      titular: nb.titular.trim(),
      uso: nb.uso,
      volumeM3Year: Math.round(parseFloat(nb.volumeM3Year) || 0),
      distanceKm: parseFloat(nb.distanceKm) || 0,
      status: nb.status,
      levelTrendMPerYear: nb.levelTrendMPerYear === "" ? undefined : parseFloat(nb.levelTrendMPerYear),
    });
    setNb({ titular: "", uso: "Agrícola", volumeM3Year: "", distanceKm: "", levelTrendMPerYear: "", status: "vigente" });
    setAddingNb(false);
  };
  // ── Manual reading capture (local backend, feeds pump health) ──
  const [rMetric, setRMetric] = useState("nivel_m");
  const [rVal, setRVal] = useState("");
  const [rBusy, setRBusy] = useState(false);
  const [readings, setReadings] = useState<Reading[]>([]);
  const rMeta = READING_METRICS.find((m) => m.key === rMetric) ?? READING_METRICS[0];
  const loadReadings = async () => {
    const all = await localRepo.getReadings(rMetric); // ascending by date
    setReadings(all.filter((x) => x.source === `manual:${selId}`).slice(-12));
  };
  useEffect(() => {
    loadReadings();
  }, [selId, rMetric]); // eslint-disable-line react-hooks/exhaustive-deps
  const saveReading = async () => {
    const v = parseFloat(rVal);
    if (!isFinite(v) || !selId) return;
    setRBusy(true);
    await localRepo.ingestReading({ source: `manual:${selId}`, metric: rMetric, value: v, unit: rMeta.unit, recordedAt: new Date().toISOString() });
    if (rMeta.field) onUpdate(selId, { [rMeta.field]: v } as Partial<Well>); // recompute health/ok
    setRVal("");
    await loadReadings();
    setRBusy(false);
  };

  // Tiny line chart of the captured history (chronological).
  const ReadingSpark = ({ data }: { data: Reading[] }) => {
    const vals = data.map((d) => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const W = 320;
    const H = 60;
    const pad = 6;
    const n = data.length;
    const xAt = (i: number) => pad + (n === 1 ? 0 : (i / (n - 1)) * (W - pad * 2));
    const yAt = (v: number) => H - pad - ((v - min) / range) * (H - pad * 2);
    const pts = data.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.value).toFixed(1)}`).join(" ");
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
        <polyline points={pts} fill="none" stroke={C.glacier} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  };

  const [waPreview, setWaPreview] = useState<string | null>(null);
  const [waBusy, setWaBusy] = useState(false);
  const testAlert = async () => {
    setWaBusy(true);
    const msg = alertsToMessage(buildAlerts(wells, pumps, aquifer));
    try {
      const r = await fetch("/api/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: msg }), signal: AbortSignal.timeout(10000) });
      const d = await r.json();
      setWaPreview(d.sent ? tr("✓ Enviado por WhatsApp", "Enviado") : (d.preview ?? msg));
    } catch {
      setWaPreview(msg);
    } finally {
      setWaBusy(false);
    }
  };
  const diag = PUMP_DIAGNOSES.find((d) => d.id === diagId) ?? PUMP_DIAGNOSES[0];
  const aquiferOver = aquifer.status === "Sobreexplotado";
  const selWell = wells.find((w) => w.id === selId) ?? wells[0];
  // Neighbor alert: a nearby concession dropping its water table unusually fast.
  const neighborAlerts = aquifer.concessions.filter((c) => (c.levelTrendMPerYear ?? 0) <= -2.0);

  const numInput: React.CSSProperties = { width: "100%", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.sm, padding: "6px 8px", color: th.ink, fontSize: fz.xs, outline: "none", fontFamily: "inherit" };
  const iconBtn: React.CSSProperties = { width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.sm, cursor: "pointer", color: th.soft, padding: 0 };

  return (
    <div style={{ padding: space.x3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: space.md, marginBottom: space.lg, flexWrap: "wrap" }}>
        <div style={{ fontSize: fz.sm, color: th.mute, maxWidth: 620 }}>
          {tr(
            "WaterSense vigila tus bombas y avisa antes de que fallen. Toca un pozo para verlo en el acuífero, edita sus datos o agrega los que falten.",
            "Mantenimiento predictivo. Selecciona un pozo para el acuífero; edita o agrega pozos."
          )}
        </div>
        <div style={{ display: "flex", gap: space.sm, flexShrink: 0, flexWrap: "wrap" }}>
          <button onClick={testAlert} disabled={waBusy} style={{ background: th.panel2, border: `1px solid ${th.line}`, color: th.ink, borderRadius: radius.md, padding: "9px 14px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }} title={tr("Vista previa de la alerta que se enviaría", "Probar alerta")}>
            <Icon name="drop" size={13} color={C.glacier} /> {waBusy ? "…" : tr("Probar alerta WhatsApp", "Probar alerta")}
          </button>
          <button onClick={onAdd} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "9px 16px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>
            + {tr("Agregar pozo", "Agregar pozo")}
          </button>
        </div>
      </div>

      {waPreview && (
        <div style={{ background: th.panel2, border: `1px solid ${C.emerald}44`, borderRadius: radius.md, padding: space.md, marginBottom: space.md, display: "flex", gap: space.md, alignItems: "flex-start" }}>
          <span style={{ width: 30, height: 30, borderRadius: radius.md, background: `${C.emerald}1f`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="drop" size={15} color={C.emerald} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ ...labelStyle(th), marginBottom: 4 }}>{tr("Así se vería tu alerta de WhatsApp", "Vista previa · WhatsApp")}</div>
            <div style={{ fontSize: fz.xs, color: th.ink, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{waPreview}</div>
            <div style={{ fontSize: fz.micro, color: th.mute, marginTop: 6 }}>{tr("Con Twilio configurado se manda a tu teléfono de Ajustes.", "Conecta Twilio + teléfono en Ajustes para envío real.")}</div>
          </div>
          <button onClick={() => setWaPreview(null)} aria-label={tr("Cerrar", "Cerrar")} style={{ background: "none", border: "none", cursor: "pointer", color: th.mute, fontSize: 15, padding: 2 }}>✕</button>
        </div>
      )}

      {wells.length === 0 ? (
        <div className="card" style={{ ...cardStyle(th), padding: `${space.x3}px ${space.xl}px`, textAlign: "center", marginBottom: space.md }}>
          <span style={{ width: 46, height: 46, borderRadius: radius.lg, background: th.panel2, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: space.md }}>
            <Icon name="wrench" size={22} color={th.mute} />
          </span>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{tr("Aún no tienes pozos", "Sin pozos registrados")}</div>
          <div style={{ fontSize: fz.sm, color: th.soft, maxWidth: 400, margin: "0 auto", lineHeight: 1.55 }}>
            {tr("Agrega tu primer pozo para vigilar su salud y avisarte de una falla antes de que ocurra.", "Agrega un pozo para iniciar el mantenimiento predictivo.")}
          </div>
          <button onClick={onAdd} style={{ marginTop: space.lg, border: "none", background: C.glacier, color: "#fff", borderRadius: radius.md, padding: "10px 18px", fontSize: fz.sm, fontWeight: 600, cursor: "pointer" }}>
            + {tr("Agregar pozo", "Agregar pozo")}
          </button>
        </div>
      ) : (
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
      )}

      {/* Manual reading capture — works offline, no cloud (LocalRepository) */}
      <div className="card" style={{ ...cardStyle(th), padding: space.xl, marginTop: space.md }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: space.md, flexWrap: "wrap", marginBottom: space.md }}>
          <div>
            <div style={{ fontWeight: 600 }}>{tr("Registrar lectura del pozo", "Captura de lectura")}</div>
            <div style={{ fontSize: fz.xs, color: th.mute, marginTop: 2 }}>
              {tr("Teclea lo que mediste; se guarda en este dispositivo y actualiza la salud de la bomba. Sin internet, sin cuenta.", "Se guarda local (sin nube). Arranques/caudal recalculan la salud.")}
            </div>
          </div>
          <span style={{ fontSize: fz.micro, fontWeight: 600, color: C.emerald, background: `${C.emerald}14`, border: `1px solid ${C.emerald}44`, padding: "3px 9px", borderRadius: radius.pill }}>{tr("Sin nube", "Local")}</span>
        </div>
        <div style={{ display: "flex", gap: space.sm, flexWrap: "wrap", alignItems: "center" }}>
          <select value={selId} onChange={(e) => setSelId(e.target.value)} style={{ ...numInput, width: "auto" }} aria-label={tr("Pozo", "Pozo")}>
            {wells.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
          </select>
          <select value={rMetric} onChange={(e) => setRMetric(e.target.value)} style={{ ...numInput, width: "auto" }} aria-label={tr("Qué mediste", "Métrica")}>
            {READING_METRICS.map((m) => (<option key={m.key} value={m.key}>{tr(m.label, m.tech)}{m.unit ? ` (${m.unit})` : ""}</option>))}
          </select>
          <div style={{ display: "flex", alignItems: "center", background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.sm, paddingRight: 8 }}>
            <input type="number" value={rVal} onChange={(e) => setRVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveReading()} placeholder={tr("Valor", "Valor")} style={{ ...numInput, border: "none", background: "transparent", width: 110 }} />
            {rMeta.unit && <span style={{ fontSize: fz.xs, color: th.mute }}>{rMeta.unit}</span>}
          </div>
          <button onClick={saveReading} disabled={rBusy || !rVal} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.sm, padding: "7px 16px", fontSize: fz.xs, fontWeight: 600, cursor: rVal ? "pointer" : "default", opacity: rVal ? 1 : 0.5 }}>{rBusy ? "…" : tr("Registrar", "Guardar")}</button>
          {rMeta.field && <span style={{ fontSize: fz.micro, color: th.soft }}>↻ {tr("recalcula la salud", "actualiza el pozo")}</span>}
        </div>
        {readings.length > 0 && (
          <div style={{ marginTop: space.lg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={labelStyle(th)}>{tr("Historial", "Tendencia")} · {tr(rMeta.label, rMeta.tech)}</span>
              {readings.length >= 2 && (() => {
                const delta = readings[readings.length - 1].value - readings[0].value;
                const col = delta === 0 ? th.mute : rMetric === "nivel_m" ? (delta > 0 ? C.critical : C.emerald) : th.soft;
                return <span className="mono" style={{ fontSize: fz.micro, fontWeight: 600, color: col }}>{delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {fmt(Math.abs(Math.round(delta)))}{rMeta.unit ? ` ${rMeta.unit}` : ""} {tr("vs. inicio", "Δ")}</span>;
              })()}
            </div>
            {readings.length >= 2 && <ReadingSpark data={readings} />}
            <div style={{ marginTop: space.sm, display: "flex", gap: space.sm, flexWrap: "wrap" }}>
              {[...readings].reverse().slice(0, 6).map((r) => (
                <span key={r.id} className="mono" style={{ fontSize: fz.micro, color: th.soft, background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.sm, padding: "3px 8px" }}>
                  {fmt(Math.round(r.value))}{r.unit ? ` ${r.unit}` : ""} · {r.recordedAt.slice(5, 10)}
                </span>
              ))}
            </div>
            {rMetric === "nivel_m" && readings.length >= 2 && (
              <div style={{ fontSize: fz.micro, color: th.mute, marginTop: 6 }}>{tr("Más metros = el agua está más abajo (acuífero cayendo).", "↑ profundidad = abatimiento.")}</div>
            )}
          </div>
        )}
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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: `${space.md}px 0 ${space.sm}px` }}>
          <span style={labelStyle(th)}>{tr("Con quién compartes (vecinos)", "Concesiones próximas")}</span>
          <button onClick={() => setAddingNb((v) => !v)} style={{ background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.sm, padding: "5px 10px", fontSize: fz.micro, fontWeight: 600, color: addingNb ? th.mute : C.glacier, cursor: "pointer" }}>
            {addingNb ? tr("Cancelar", "Cancelar") : `+ ${tr("Agregar vecino", "Agregar")}`}
          </button>
        </div>

        {addingNb && (
          <div style={{ background: th.panel2, border: `1px solid ${th.line}`, borderRadius: radius.md, padding: space.md, marginBottom: space.sm, display: "flex", flexWrap: "wrap", gap: space.sm, alignItems: "center" }}>
            <input value={nb.titular} onChange={(e) => setNb((s) => ({ ...s, titular: e.target.value }))} placeholder={tr("Nombre o predio del vecino", "Titular")} style={{ ...numInput, flex: 1, minWidth: 160 }} />
            <select value={nb.uso} onChange={(e) => setNb((s) => ({ ...s, uso: e.target.value as WaterConcession["uso"] }))} style={{ ...numInput, width: "auto" }} aria-label={tr("Uso", "Uso")}>
              {(["Agrícola", "Público urbano", "Industrial", "Pecuario"] as const).map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
            <input type="number" value={nb.volumeM3Year} onChange={(e) => setNb((s) => ({ ...s, volumeM3Year: e.target.value }))} placeholder={tr("m³/año", "m³/año")} style={{ ...numInput, width: 110 }} />
            <input type="number" value={nb.distanceKm} onChange={(e) => setNb((s) => ({ ...s, distanceKm: e.target.value }))} placeholder={tr("dist. km", "km")} style={{ ...numInput, width: 90 }} />
            <input type="number" step="0.1" value={nb.levelTrendMPerYear} onChange={(e) => setNb((s) => ({ ...s, levelTrendMPerYear: e.target.value }))} placeholder={tr("nivel m/año (ej. -2.4)", "m/año")} style={{ ...numInput, width: 130 }} title={tr("Descenso del nivel: negativo si baja", "Tendencia del nivel freático")} />
            <button onClick={saveNb} style={{ border: "none", background: C.glacier, color: "#fff", borderRadius: radius.sm, padding: "7px 14px", fontSize: fz.xs, fontWeight: 600, cursor: "pointer" }}>{tr("Guardar", "Guardar")}</button>
          </div>
        )}

        {aquifer.concessions.map((c, i) => {
          const trend = c.levelTrendMPerYear ?? 0;
          const trendColor = trend <= -2 ? C.critical : trend <= -1.2 ? C.alert : C.emerald;
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: space.md, padding: "8px 0", borderBottom: i < aquifer.concessions.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: fz.sm, color: th.ink }}>{c.titular}</div>
                <div className="mono" style={{ fontSize: fz.micro, color: th.mute }}>{c.uso} · {c.distanceKm} km{c.status !== "vigente" ? ` · ${c.status}` : ""}</div>
              </div>
              {trend !== 0 && (
                <span className="mono" style={{ fontSize: fz.micro, fontWeight: 600, color: trendColor }} title={tr("descenso del nivel freático", "tendencia nivel")}>
                  {trend > 0 ? "↑" : "↓"} {Math.abs(trend)} m/{tr("año", "a")}
                </span>
              )}
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
