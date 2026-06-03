"use client";

import { useState } from "react";
import type { CostItem, Parcel } from "@/types/domain";
import { C, cardStyle, fmt, space, fz, radius, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";
import { HourlyPrices } from "./HourlyPrices";

export function CostosView({ th, tr, costs, tariffCurve, parcels }: { th: Theme; tr: (s: string, t: string) => string; costs: CostItem[]; tariffCurve: number[]; parcels: Parcel[] }) {
  const total = costs.reduce((s, c) => s + c.month, 0);
  const [open, setOpen] = useState<string | null>("luz");

  return (
    <div style={{ padding: space.x3, maxWidth: 920 }}>
      <div className="card" style={{ ...cardStyle(th), overflow: "hidden" }}>
        <div style={{ padding: `${space.lg}px ${space.xl}px`, borderBottom: `1px solid ${th.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{tr("Tus costos de este mes", "Costos operativos · mes")}</div>
            <div style={{ fontSize: fz.xs, color: th.mute, marginTop: 2 }}>{tr("Toca la luz para ver el detalle por hora", "Toca un rubro para desglose")}</div>
          </div>
          <span className="mono" style={{ fontSize: fz.xl, fontWeight: 700, color: th.ink }}>${fmt(total)}</span>
        </div>

        {costs.map((c, i) => {
          const expandable = c.id === "luz";
          const isOpen = open === c.id;
          return (
            <div key={c.id} style={{ borderBottom: i < costs.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <div
                onClick={() => expandable && setOpen(isOpen ? null : c.id)}
                style={{ padding: `${space.md}px ${space.xl}px`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: expandable ? "pointer" : "default", background: isOpen ? th.panel2 : "transparent", transition: "background .2s" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: space.md }}>
                  <span style={{ width: 32, height: 32, borderRadius: radius.md, background: th.panel2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={c.icon} size={16} color={c.id === "luz" ? C.alert : c.id === "agua" ? C.glacier : th.soft} />
                  </span>
                  <div>
                    <div style={{ fontSize: fz.sm, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                      {c.label}
                      {expandable && <span style={{ fontSize: fz.micro, color: C.emerald, border: `1px solid ${C.emerald}55`, borderRadius: radius.sm, padding: "1px 6px" }}>{isOpen ? tr("ocultar", "ocultar") : tr("ver por hora", "detalle")}</span>}
                    </div>
                    <div style={{ fontSize: fz.xs, color: th.mute }}>{c.note}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: fz.md, fontWeight: 600 }}>${fmt(c.month)}</div>
                  <div style={{ fontSize: fz.xs, fontWeight: 600, color: c.trend < 0 ? C.emerald : c.trend > 0 ? C.critical : th.mute }}>
                    {c.trend > 0 ? "↑" : c.trend < 0 ? "↓" : "="} {Math.abs(c.trend)}%
                  </div>
                </div>
              </div>
              {expandable && isOpen && (
                <div style={{ background: th.panel2, borderTop: `1px solid ${th.line}` }}>
                  <HourlyPrices th={th} tr={tr} prices={tariffCurve} parcels={parcels} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: fz.xs, color: th.mute, marginTop: space.md, lineHeight: 1.5 }}>
        {tr(
          "Cifras simuladas con rangos típicos de Chihuahua. Con datos reales (CFE, CONAGUA, CENACE), estos números vendrían de tus recibos y del mercado eléctrico en tiempo real.",
          "Datos simulados · rangos típicos región Delicias. Pendiente integración CFE/CONAGUA/CENACE."
        )}
      </p>
    </div>
  );
}
