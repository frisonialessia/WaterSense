"use client";

import { useEffect, useMemo, useState } from "react";
import type { Parcel } from "@/types/domain";
import type { DecisionInput, DecisionResult } from "@/lib/brain/decisionEngine";
import { C, space, fz, radius, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";

const DECISION_LABEL: Record<string, { s: string; t: string; color: (c: typeof C) => string }> = {
  IRRIGATE_NOW: { s: "Regar ahora", t: "Regar ahora", color: (c) => c.glacier },
  WAIT: { s: "Conviene esperar", t: "Esperar ventana barata", color: (c) => c.emerald },
  EMERGENCY_IRRIGATE: { s: "Riego urgente", t: "Riego de emergencia", color: (c) => c.critical },
};

export function HourlyPrices({ th, tr, prices, parcels }: { th: Theme; tr: (s: string, t: string) => string; prices: number[]; parcels: Parcel[] }) {
  const [hour, setHour] = useState(() => new Date().getHours());
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [liveCurve, setLiveCurve] = useState<number[] | null>(null);
  const [liveSource, setLiveSource] = useState<string>("");

  const curve = liveCurve ?? prices;
  const max = useMemo(() => Math.max(...curve), [curve]);
  const cheapest = useMemo(() => curve.indexOf(Math.min(...curve)), [curve]);

  // animate the "current hour" cursor like the prototype
  useEffect(() => {
    const t = setInterval(() => setHour((h) => (h + 1) % 24), 2000);
    return () => clearInterval(t);
  }, []);

  // Try live CENACE prices (falls back to simulated automatically).
  useEffect(() => {
    fetch("/api/tariff")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.curve) && d.curve.length === 24) {
          setLiveCurve(d.curve);
          setLiveSource(d.source ?? "");
        }
      })
      .catch(() => {});
  }, []);

  // Connect the real decision engine: should we irrigate now or wait for the
  // cheap window? Representative input built from the most-stressed parcel.
  useEffect(() => {
    const stressed = [...parcels].sort((a, b) => b.stress - a.stress)[0];
    const moisture = stressed ? Math.round((1 - stressed.stress) * 100) : 40;
    const nowHour = new Date().getHours();
    const hoursUntilCheap = ((cheapest - nowHour) % 24 + 24) % 24;
    const input: DecisionInput = {
      soil: { currentMoisture: moisture, criticalThreshold: 30, wiltingPoint: 12, depletionRatePerHour: 1.4 },
      currentTariff: { pricePerKwh: curve[nowHour] ?? 1.8, startsInHours: 0, durationHours: 4 },
      nextLowTariff: { pricePerKwh: curve[cheapest] ?? 0.6, startsInHours: hoursUntilCheap, durationHours: 4 },
      crop: { stressCostPerHour: 6, severityMultiplier: 2 },
      pump: { flowRateLitersPerHour: 6000, powerKw: 15 },
      irrigationVolumeLiters: 24000,
    };
    fetch("/api/decision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) })
      .then((r) => r.json())
      .then(setDecision)
      .catch(() => setDecision(null));
  }, [curve, cheapest, parcels]);

  const dl = decision ? DECISION_LABEL[decision.decision] : null;

  return (
    <div style={{ padding: `${space.xs}px ${space.xl}px ${space.lg}px` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: space.md }}>
        <div style={{ fontSize: fz.xs, color: th.soft, display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="clock" size={14} color={th.soft} />
          {tr("Precio de la luz hora a hora — la barra verde es la más barata para regar", "Precio spot por hora · CENACE · $/kWh")}
          {liveSource === "cenace" ? (
            <span style={{ fontSize: fz.micro, color: C.emerald, fontWeight: 600 }}>· CENACE en vivo</span>
          ) : liveSource ? (
            <span style={{ fontSize: fz.micro, color: th.mute }}>· estimado</span>
          ) : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mono" style={{ fontSize: fz.lg, fontWeight: 700, color: hour === cheapest ? C.emerald : C.glacier }}>${(curve[hour] ?? 0).toFixed(2)}</div>
          <div style={{ fontSize: fz.micro, color: th.mute }}>{tr("ahora", "hora")} {hour}:00</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 110 }}>
        {curve.map((p, h) => (
          <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: `${(p / max) * 88}px`, borderRadius: "3px 3px 0 0", background: h === cheapest ? C.emerald : h === hour ? C.glacier : th.line, transition: "background .3s" }} />
            <span className="mono" style={{ fontSize: 8, color: h % 6 === 0 ? th.soft : "transparent" }}>{h}</span>
          </div>
        ))}
      </div>

      {dl && (
        <div style={{ marginTop: space.md, padding: `${space.md}px ${space.md}px`, borderRadius: radius.md, background: `${dl.color(C)}10`, border: `1px solid ${dl.color(C)}33`, fontSize: fz.sm, color: th.ink, lineHeight: 1.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: dl.color(C) }} />
            <span style={{ fontWeight: 600, color: dl.color(C) }}>{tr(dl.s, dl.t)}</span>
            <span className="mono" style={{ marginLeft: "auto", fontSize: fz.micro, color: th.mute }}>
              {tr("hora más barata", "óptimo")} {cheapest}:00
            </span>
          </div>
          {decision?.reasoning}
        </div>
      )}
      <p style={{ fontSize: fz.micro, color: th.mute, marginTop: space.sm }}>
        {liveSource === "cenace"
          ? tr("Precio en vivo de CENACE; recomendación calculada por el motor (/api/decision).", "Precio CENACE en vivo · decisión vía /api/decision.")
          : tr("Precio estimado (CENACE no disponible ahora); recomendación vía /api/decision.", "Precio estimado · CENACE no disponible · decisión vía /api/decision.")}
      </p>
    </div>
  );
}
