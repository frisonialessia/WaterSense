// ============================================================
// WaterSense — Irrigation factors (pure helpers)
// Turn the farmer's choices (system, soil, planting date, tariff)
// into real adjustments on water, cost, frequency and savings.
// ============================================================

import type { IrrigationSystem, SoilType, TariffType } from "@/types/domain";

/** Applied-water multiplier vs. sprinkler baseline. Drip saves; gravity wastes. */
export function irrigationEfficiency(s?: IrrigationSystem): number {
  return s === "Goteo" ? 0.8 : s === "Gravedad" ? 1.35 : 1.0;
}

/** Watering-frequency multiplier. Sandy soils drain fast → water more often. */
export function soilFrequencyFactor(s?: SoilType): number {
  return s === "Arenoso" ? 0.8 : s === "Arcilloso" ? 1.2 : 1.0;
}

export interface GrowthInfo {
  stage: string;
  /** crop coefficient-like demand (relative) */
  kc: number;
}

/** Derive a coarse growth stage + relative water demand from planting date. */
export function growthFromDate(plantingDate?: string): GrowthInfo | null {
  if (!plantingDate) return null;
  const d = new Date(plantingDate);
  if (isNaN(d.getTime())) return null;
  const days = Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
  if (days < 30) return { stage: "Siembra / inicial", kc: 0.4 };
  if (days < 60) return { stage: "Desarrollo", kc: 0.75 };
  if (days < 120) return { stage: "Floración / llenado", kc: 1.1 };
  return { stage: "Madurez", kc: 0.7 };
}

/** How much of the night-tariff saving the farmer can capture. */
export function tariffSavingsFactor(t?: TariffType): number {
  return t === "Nocturna (CFE)" ? 1.0 : t === "Horaria" ? 0.8 : 0.55;
}
