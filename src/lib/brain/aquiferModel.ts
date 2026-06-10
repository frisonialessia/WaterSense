// ============================================================
// WaterSense — Aquifer projection model
// The "future of water" brain: projects water-table depth over
// time and computes the year a well becomes unviable.
// Pure function. Inputs structured for real CONAGUA piezometry.
// ============================================================

export interface AquiferInputs {
  /** current depth to water table, meters */
  startLevelM: number;
  /** depth at which the pump is no longer viable, meters */
  criticalLevelM: number;
  /** natural recharge, meters/year */
  rechargeMPerYear: number;
  /** your annual extraction expressed as drop in meters/year at 100% */
  baseExtractionM: number;
  /** 0..1+ multiplier on your extraction (the lever) */
  extractionFactor: number;
  /** 0..1 fracción de agua ahorrada al tecnificar el riego (goteo/aspersión) */
  irrigationTech?: number;
  /** number of neighbors sharing the aquifer */
  neighbors: number;
  /** per-neighbor drop contribution, meters/year */
  neighborDrawM: number;
  /** 0..1 fraction of rain captured & reused */
  rainReuse: number;
  /** 0..1 fraction of drainage water reused */
  drainReuse: number;
  /** 0..1 managed aquifer recharge (infiltration basins / injection wells) */
  rechargeMAR: number;
  /** 0..1 treated wastewater reused for irrigation */
  wastewaterReuse: number;
  /** 0..1 runoff capture (check dams / bordos / ollas de agua) */
  runoffCapture: number;
  /** projection horizon in years */
  horizonYears: number;
  /** calendar year of "now" */
  baseYear: number;
}

export interface AquiferProjection {
  /** depth (m) per year index 0..horizon */
  levels: number[];
  annualDropM: number;
  /** calendar year well becomes unviable, or null if it survives the horizon */
  limitYear: number | null;
  survives: boolean;
  /** years gained vs the do-nothing baseline */
  yearsGained: number;
}

export function projectAquifer(i: AquiferInputs): AquiferProjection {
  const yourDraw = i.baseExtractionM * i.extractionFactor * (1 - (i.irrigationTech ?? 0) * 0.35);
  const neighborDraw = i.neighborDrawM * i.neighbors;
  // Each lever offsets the annual drop. Coefficients (m/yr at 100%) reflect
  // how much each method puts back / saves: direct recharge (MAR) is strongest,
  // then drainage/wastewater reuse, then rain & runoff capture.
  const reuseOffset =
    i.rainReuse * 1.1 +
    i.drainReuse * 1.4 +
    i.rechargeMAR * 1.6 +
    i.wastewaterReuse * 1.2 +
    i.runoffCapture * 0.9;
  const annualDropM = Math.max(-1, yourDraw + neighborDraw - i.rechargeMPerYear - reuseOffset);

  const levels: number[] = [];
  let limitYear: number | null = null;
  for (let y = 0; y <= i.horizonYears; y++) {
    const lvl = Math.min(i.criticalLevelM + 10, i.startLevelM + annualDropM * y);
    levels.push(lvl);
    if (limitYear === null && lvl >= i.criticalLevelM) limitYear = i.baseYear + y;
  }
  const survives = limitYear === null;

  // baseline: do nothing (100% extraction, 3 neighbors, no reuse)
  const baseDrop = i.baseExtractionM + i.neighborDrawM * 3 - i.rechargeMPerYear;
  let baseLimit: number | null = null;
  for (let y = 0; y <= i.horizonYears; y++) {
    if (i.startLevelM + baseDrop * y >= i.criticalLevelM) {
      baseLimit = i.baseYear + y;
      break;
    }
  }
  const yearsGained =
    (limitYear ?? i.baseYear + i.horizonYears) - (baseLimit ?? i.baseYear + i.horizonYears);

  return { levels, annualDropM, limitYear, survives, yearsGained };
}
