"use client";

import type { Parcel, Well, CostItem } from "@/types/domain";
import type { PumpHealth } from "@/lib/brain/pumpHealth";
import { C, fmt, space, fz, labelStyle, type Theme } from "@/lib/theme";

// The signature control-room element: a tight, monospaced metric strip.
// Numbers are neutral; the single alert (wells over the limit) is the only
// place color carries danger — per the brand rule of one red per screen.

export function KpiStrip({
  th,
  tr,
  costs,
  parcels,
  wells,
  pumps,
}: {
  th: Theme;
  tr: (s: string, t: string) => string;
  costs: CostItem[];
  parcels: Parcel[];
  wells: Well[];
  pumps: PumpHealth[];
}) {
  const total = costs.reduce((s, c) => s + c.month, 0);
  const healthy = parcels.filter((p) => p.stress < 0.5).length;
  const wellsAlert = wells.filter((w) => !w.ok).length;
  const avgHealth = pumps.length ? Math.round(pumps.reduce((s, p) => s + p.health, 0) / pumps.length) : 0;

  const items: { label: string; value: string; sub?: string; danger?: boolean }[] = [
    { label: tr("Gasto del mes", "Costo mensual"), value: `$${fmt(total)}`, sub: tr("5 rubros", "OPEX") },
    { label: tr("Parcelas sanas", "Salud cultivos"), value: `${healthy}/${parcels.length}`, sub: tr("sed < 50%", "stress < .5") },
    { label: tr("Salud de bombas", "Pump health"), value: `${avgHealth}%`, sub: tr("promedio", "media") },
    { label: tr("Pozos en alerta", "Wells alert"), value: `${wellsAlert}`, sub: tr("sobre el límite", "over limit"), danger: wellsAlert > 0 },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        borderBottom: `1px solid ${th.line}`,
        background: th.panel,
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{
            padding: `${space.md}px ${space.x2}px`,
            borderLeft: i === 0 ? "none" : `1px solid ${th.line}`,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span style={labelStyle(th)}>{it.label}</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="mono" style={{ fontSize: fz.xl, fontWeight: 700, color: it.danger ? C.critical : th.ink, lineHeight: 1 }}>
              {it.value}
            </span>
            {it.danger && <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.critical }} />}
          </div>
          {it.sub && <span className="mono" style={{ fontSize: fz.micro, color: th.mute }}>{it.sub}</span>}
        </div>
      ))}
    </div>
  );
}
