// ============================================================
// WaterSense — Water-stress risk ("point of no return")
// How long until a parcel hits critical thirst, and what it
// would cost to ignore it. Pure function.
// ============================================================

import { projectYield } from "./yieldModel";

export interface StressRiskInputs {
  /** 0..1 current water-stress index */
  stress: number;
  hectares: number;
  yieldKgHa: number;
  pricePerKg: number;
  /** stress added per day if not irrigated (default 0.06 ≈ ~7 days to critical) */
  depletionPerDay?: number;
}

export interface StressRisk {
  level: "ok" | "watch" | "urgent";
  /** hours until the parcel reaches the critical stress threshold */
  hoursToCritical: number;
  /** money at risk if the farmer does nothing now, $ */
  projectedLoss: number;
}

const CRITICAL = 0.9;

export function assessStressRisk(i: StressRiskInputs): StressRisk {
  const rate = i.depletionPerDay ?? 0.06;
  const hoursToCritical = Math.max(0, Math.round(((CRITICAL - i.stress) / rate) * 24));

  const level: StressRisk["level"] = i.stress >= 0.7 ? "urgent" : i.stress >= 0.5 ? "watch" : "ok";

  // Loss = revenue gap between staying at today's stress vs. letting it slip
  // toward critical (a representative near-term consequence of inaction).
  const now = projectYield({ yieldKgHa: i.yieldKgHa, hectares: i.hectares, stress: i.stress, pricePerKg: i.pricePerKg });
  const worse = projectYield({ yieldKgHa: i.yieldKgHa, hectares: i.hectares, stress: Math.min(1, i.stress + 0.2), pricePerKg: i.pricePerKg });
  const projectedLoss = Math.max(0, now.revenue - worse.revenue);

  return { level, hoursToCritical, projectedLoss };
}
