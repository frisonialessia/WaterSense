"use client";

import type { Well } from "@/types/domain";
import type { PumpHealth } from "@/lib/brain/pumpHealth";
import { C, cardStyle, fmt, space, fz, radius, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";

const STATUS_COLOR: Record<PumpHealth["status"], string> = { ok: C.emerald, warn: C.alert, critical: C.critical };

export function PozosView({ th, tr, wells, pumps }: { th: Theme; tr: (s: string, t: string) => string; wells: Well[]; pumps: PumpHealth[] }) {
  const byId = new Map(pumps.map((p) => [p.wellId, p]));

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

      <p style={{ fontSize: fz.xs, color: th.mute, marginTop: space.sm, lineHeight: 1.5 }}>
        {tr(
          "Datos simulados; la salud la calcula el motor (assessPump) a partir de arranques y presión. Con sensores reales por bomba, estas alertas se basarían en el desgaste medido.",
          "Datos simulados · salud calculada por el motor (assessPump). Estructura lista para sensores de presión/caudal reales por bomba."
        )}
      </p>
    </div>
  );
}
