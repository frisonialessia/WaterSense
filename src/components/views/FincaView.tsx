"use client";

import { useEffect, useRef, useState } from "react";
import type { Parcel, WeatherDay, ScheduledAction, SavingsSummary } from "@/types/domain";
import { C, FONT, cardStyle, fmt, space, fz, radius, type Theme } from "@/lib/theme";
import { Icon } from "../Icon";
import type { ViewId } from "../Sidebar";

function useCount(target: number, dur = 1100) {
  const [v, setV] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return Math.round(v);
}

const TONE: Record<ScheduledAction["tone"], string> = { emerald: C.emerald, alert: C.alert, glacier: C.glacier };

export function FincaView({
  th,
  tr,
  setView,
  parcels,
  forecast,
  actions,
  savings,
}: {
  th: Theme;
  tr: (s: string, t: string) => string;
  setView: (v: ViewId) => void;
  parcels: Parcel[];
  forecast: WeatherDay[];
  actions: ScheduledAction[];
  savings: SavingsSummary;
}) {
  const saved = useCount(savings.amountThisMonth);
  const [done, setDone] = useState(false);
  const rainDay = forecast.find((f) => f.rainMm >= 10);
  const healthy = parcels.filter((p) => p.stress < 0.5).length;

  const cards = [
    {
      l: tr("Hoy debes regar", "Acción prioritaria"),
      v: tr("Parcela del chile", "Parcela chile"),
      s: tr("a las 2am · ahorras $90", "tarifa baja · 02:00"),
      c: C.alert,
      action: done ? tr("Riego programado ✓", "Programado ✓") : tr("Programar riego", "Programar"),
      onAct: () => setDone(true),
      solid: !done,
    },
    {
      l: tr("Tus cultivos", "Salud general"),
      v: `${healthy} ${tr("sanos", "OK")}`,
      s: `${parcels.length} ${tr("parcelas", "zonas")}`,
      c: C.emerald,
      action: tr("Ver mapa", "Ver mapa"),
      onAct: () => setView("mapa"),
      solid: false,
    },
    {
      l: tr("Tus pozos", "Acuífero"),
      v: tr("1 en cuidado", "1 alerta"),
      s: tr("el pozo chico baja", "sobreexplotación"),
      c: C.critical,
      action: tr("Revisar pozos", "Revisar"),
      onAct: () => setView("pozos"),
      solid: false,
    },
  ];

  return (
    <div style={{ padding: space.x3, maxWidth: 1120 }}>
      {/* cover — the dashboard's one brand-gradient moment */}
      <div className="card" style={{ background: `linear-gradient(110deg,${C.brandNavy},${C.glacier} 60%,${C.emerald})`, borderRadius: radius.lg, padding: `${space.x2}px ${space.x2}px`, marginBottom: space.lg, position: "relative", overflow: "hidden", color: "#fff" }}>
        <p style={{ fontSize: fz.sm, color: "rgba(255,255,255,.85)", marginBottom: space.sm }}>{tr("Lo que llevas ahorrado este mes", "Auditoría contrafactual")}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: space.md, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.hero }}>${fmt(saved)}</span>
          <span style={{ fontSize: fz.md, color: "rgba(255,255,255,.9)" }}>{tr("vs. regar como antes, sin WaterSense", "frente a patrón histórico")}</span>
        </div>
        <span style={{ display: "inline-block", marginTop: space.md, fontSize: fz.xs, fontWeight: 600, background: "rgba(255,255,255,.2)", padding: "4px 11px", borderRadius: radius.pill }}>
          ↑ +{savings.vsLastMonthPct}% {tr("que el mes pasado", "vs. mes anterior")}
        </span>
      </div>

      {/* action cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: space.md, marginBottom: space.lg }}>
        {cards.map((x, i) => (
          <div key={i} className="card" style={{ ...cardStyle(th), animationDelay: `${i * 0.06}s`, padding: space.xl, display: "flex", flexDirection: "column" }}>
            <p style={{ fontSize: fz.xs, color: th.mute, marginBottom: 6 }}>{x.l}</p>
            <p style={{ fontFamily: FONT.title, fontWeight: 600, fontSize: fz.xl, color: x.c }}>{x.v}</p>
            <p style={{ fontSize: fz.xs, color: th.soft, marginTop: 6, marginBottom: space.lg }}>{x.s}</p>
            <button
              onClick={x.onAct}
              style={{ marginTop: "auto", border: x.solid ? "none" : `1px solid ${th.line}`, background: x.solid ? C.glacier : th.panel2, color: x.solid ? "#fff" : th.ink, borderRadius: radius.md, padding: "9px 0", fontSize: fz.sm, fontWeight: 600, cursor: "pointer", transition: ".2s" }}
            >
              {x.action}
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: space.md }}>
        {/* weather + rain impact */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("El clima y tu riego", "Pronóstico · impacto en riego")}</div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.lg }}>{tr("Delicias · próximos 5 días", "Delicias, Chihuahua · 5 días")}</div>
          <div style={{ display: "flex", gap: space.sm, marginBottom: space.lg }}>
            {forecast.map((f, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "12px 4px", borderRadius: radius.md, background: f.rainMm >= 10 ? `${C.glacier}14` : th.panel2, border: `1px solid ${f.rainMm >= 10 ? C.glacier + "44" : th.line}` }}>
                <div style={{ fontSize: fz.micro, color: th.mute, marginBottom: 7 }}>{f.day}</div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 7 }}>
                  <Icon name={f.icon} size={20} color={f.rainMm >= 10 ? C.glacier : th.soft} />
                </div>
                <div className="mono" style={{ fontSize: fz.xs, fontWeight: 600 }}>{f.tempMax}°</div>
                {f.rainMm > 0 && <div className="mono" style={{ fontSize: 10, color: C.glacier, marginTop: 2 }}>{f.rainMm}mm</div>}
              </div>
            ))}
          </div>
          {rainDay && (
            <div style={{ padding: `${space.md}px ${space.md}px`, borderRadius: radius.md, background: `${C.emerald}12`, border: `1px solid ${C.emerald}33`, fontSize: fz.sm, color: th.ink, display: "flex", alignItems: "center", gap: 9 }}>
              <Icon name="leaf" size={15} color={C.emerald} />
              {tr(
                `Lloverá el ${rainDay.day.toLowerCase()} (${rainDay.rainMm}mm). Cubre el riego de 2 parcelas — pausamos y ahorras ~$210.`,
                `Precipitación ${rainDay.rainMm}mm el ${rainDay.day}. Riego pausado en 2 zonas · ahorro estimado $210.`
              )}
            </div>
          )}
        </div>

        {/* next actions */}
        <div className="card" style={{ ...cardStyle(th), padding: space.xl }}>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{tr("Qué hará WaterSense por ti", "Próximas acciones automáticas")}</div>
          <div style={{ fontSize: fz.xs, color: th.mute, marginBottom: space.md }}>{tr("Sin que muevas un dedo", "Programado por el motor")}</div>
          {actions.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: space.md, padding: "11px 0", borderBottom: i < actions.length - 1 ? `1px solid ${th.line}` : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: TONE[a.tone], flexShrink: 0 }} />
              <span style={{ fontSize: fz.sm, color: th.ink }}>{a.text}</span>
              <span className="mono" style={{ marginLeft: "auto", fontSize: fz.xs, color: th.mute }}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
