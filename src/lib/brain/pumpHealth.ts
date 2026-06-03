// ============================================================
// WaterSense — Pump health (predictive maintenance)
// Estimates remaining life and failure risk from starts +
// pressure trend. Structured for real sensor telemetry later.
// ============================================================

import type { Well } from "@/types/domain";

export interface PumpHealth {
  wellId: string;
  /** 0..100 health score */
  health: number;
  lifeUsedPct: number;
  status: "ok" | "warn" | "critical";
  /** estimated months to likely failure, null if healthy */
  monthsToFailure: number | null;
  note: string;
}

export function assessPump(well: Well, pressureDropPct = 0): PumpHealth {
  const lifeUsedPct = Math.round((well.starts / well.ratedStarts) * 100);
  // health blends remaining life and pressure anomaly
  const lifeScore = Math.max(0, 100 - lifeUsedPct);
  const pressureScore = Math.max(0, 100 - pressureDropPct * 4);
  const health = Math.round(lifeScore * 0.6 + pressureScore * 0.4);

  let status: PumpHealth["status"] = "ok";
  let monthsToFailure: number | null = null;
  let note = "funcionando normal";

  if (health < 45 || lifeUsedPct > 92) {
    status = "warn";
    monthsToFailure = Math.max(1, Math.round((health / 45) * 4));
    note = "caída de presión y desgaste · revisar pronto";
  }
  if (health < 20) {
    status = "critical";
    monthsToFailure = 1;
    note = "riesgo alto de falla inminente";
  } else if (health >= 45 && health < 75) {
    note = "desgaste moderado";
  }

  return { wellId: well.id, health, lifeUsedPct, status, monthsToFailure, note };
}
