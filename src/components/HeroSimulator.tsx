"use client";

// Interactive hero panel: the visitor moves their extraction % and watches
// the aquifer projection change live (runs the real brain, client-side).
import { useState } from "react";
import { projectAquifer } from "@/lib/brain/aquiferModel";
import { C, T, FONT, fz, space, radius, shadow } from "@/lib/theme";

const th = T.light;
const BASE_YEAR = 2026;
const START = 78;
const CRIT = 140;

export function HeroSimulator() {
  const [ext, setExt] = useState(100);
  const proj = projectAquifer({
    startLevelM: START,
    criticalLevelM: CRIT,
    rechargeMPerYear: 2.2,
    baseExtractionM: 3.4,
    extractionFactor: ext / 100,
    neighbors: 2,
    neighborDrawM: 0.9,
    rainReuse: 0,
    drainReuse: 0,
    rechargeMAR: 0,
    wastewaterReuse: 0,
    runoffCapture: 0,
    horizonYears: 30,
    baseYear: BASE_YEAR,
  });
  const survives = proj.survives;
  const limitYear = proj.limitYear;
  const planColor = survives ? C.emerald : ext > 110 ? C.critical : C.alert;

  const W = 340;
  const H = 130;
  const x = (i: number) => 6 + (i / 30) * (W - 12);
  const yv = (v: number) => 8 + ((v - 60) / (CRIT + 12 - 60)) * (H - 20);
  const pts = proj.levels.map((v, i) => `${x(i)},${yv(Math.min(CRIT + 12, v))}`).join(" ");

  return (
    <div style={{ background: th.panel, border: `1px solid ${th.line}`, borderRadius: radius.lg, boxShadow: shadow.lg, overflow: "hidden" }}>
      <div style={{ padding: `${space.md}px ${space.lg}px`, borderBottom: `1px solid ${th.line}` }}>
        <div style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.md }}>Futuro del agua</div>
        <div style={{ fontSize: fz.xs, color: th.soft, marginTop: 2 }}>Mueve tu extracción y mira qué pasa con tu pozo</div>
      </div>

      <div style={{ padding: space.lg }}>
        {/* result */}
        <div style={{ display: "flex", alignItems: "baseline", gap: space.sm, marginBottom: space.md }}>
          {survives ? (
            <>
              <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: C.emerald }}>+30 años</span>
              <span style={{ fontSize: fz.xs, color: th.soft }}>tu pozo aguanta</span>
            </>
          ) : (
            <>
              <span className="mono" style={{ fontFamily: FONT.title, fontWeight: 700, fontSize: fz.xl, color: planColor }}>{limitYear}</span>
              <span style={{ fontSize: fz.xs, color: th.soft }}>tu pozo deja de dar agua</span>
            </>
          )}
        </div>

        {/* slider */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span style={{ fontSize: fz.xs, color: th.ink, fontWeight: 500 }}>Cuánta agua extraes</span>
          <span className="mono" style={{ fontSize: fz.sm, fontWeight: 700, color: planColor }}>{ext}%</span>
        </div>
        <input type="range" min={50} max={130} value={ext} onChange={(e) => setExt(+e.target.value)} style={{ width: "100%", accentColor: planColor, cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: th.mute, marginBottom: space.md }}>
          <span>cuidas el agua</span>
          <span>sobreexplotas</span>
        </div>

        {/* chart — line shaded green → orange → red as the water gets deeper */}
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%" }}>
          <defs>
            <linearGradient id="hsLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.emerald} />
              <stop offset="55%" stopColor={C.alert} />
              <stop offset="100%" stopColor={C.critical} />
            </linearGradient>
          </defs>
          <rect x="0" y={yv(CRIT)} width={W} height={H - yv(CRIT)} fill={C.critical} opacity="0.07" />
          <line x1="0" y1={yv(CRIT)} x2={W} y2={yv(CRIT)} stroke={C.critical} strokeWidth="1" strokeDasharray="5 4" />
          <polyline points={pts} fill="none" stroke="url(#hsLine)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: th.mute, marginTop: 2 }}>
          <span>{BASE_YEAR}</span>
          <span style={{ color: C.critical }}>← más hondo el agua</span>
          <span>{BASE_YEAR + 30}</span>
        </div>
      </div>
    </div>
  );
}
