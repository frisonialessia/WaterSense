// ============================================================
// WaterSense — Yield projection (irrigation as investment)
// Turns water stress into expected harvest (kg) and money ($).
// Pure function. Structured for real agronomic curves later.
// ============================================================

export interface YieldInputs {
  /** expected yield kg/ha at full irrigation */
  yieldKgHa: number;
  hectares: number;
  /** 0..1 water-stress index (higher = drier = less yield) */
  stress: number;
  /** farm-gate price, $/kg */
  pricePerKg: number;
}

export interface YieldProjection {
  potentialKg: number;
  projectedKg: number;
  /** projected yield as % of potential */
  pct: number;
  /** projected revenue, $ */
  revenue: number;
  /** revenue lost to stress vs. full potential, $ */
  lostRevenue: number;
}

/**
 * Water stress lowers yield. We model a simple linear response:
 * at no stress → 100% of potential; severe stress caps the loss.
 * (Real crops follow FAO-style yield-response curves; this is the seam.)
 */
export function projectYield(i: YieldInputs): YieldProjection {
  const potentialKg = Math.round(i.yieldKgHa * i.hectares);
  const fraction = Math.max(0.2, 1 - 0.6 * Math.min(1, Math.max(0, i.stress)));
  const projectedKg = Math.round(potentialKg * fraction);
  const pct = Math.round(fraction * 100);
  const revenue = Math.round(projectedKg * i.pricePerKg);
  const lostRevenue = Math.round((potentialKg - projectedKg) * i.pricePerKg);
  return { potentialKg, projectedKg, pct, revenue, lostRevenue };
}
