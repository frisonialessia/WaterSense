// ============================================================
// WaterSense — Tariff Decision Engine
// Decide: irrigate NOW vs WAIT for the next low-tariff window,
// weighing energy savings against crop-stress cost.
// Pure function, no I/O — testable and runs server-side.
// ============================================================

export type IrrigationDecision = "IRRIGATE_NOW" | "WAIT" | "EMERGENCY_IRRIGATE";

export interface SoilState {
  currentMoisture: number;
  criticalThreshold: number;
  wiltingPoint: number;
  depletionRatePerHour: number;
}

export interface TariffWindow {
  pricePerKwh: number;
  startsInHours: number;
  durationHours: number;
}

export interface CropEconomics {
  stressCostPerHour: number;
  severityMultiplier: number;
}

export interface PumpProfile {
  flowRateLitersPerHour: number;
  powerKw: number;
}

export interface DecisionInput {
  soil: SoilState;
  currentTariff: TariffWindow;
  nextLowTariff: TariffWindow;
  crop: CropEconomics;
  pump: PumpProfile;
  irrigationVolumeLiters: number;
}

export interface DecisionResult {
  decision: IrrigationDecision;
  reasoning: string;
  costNow: number;
  costLater: number;
  stressRiskCost: number;
  netSavings: number;
}

function energyCost(input: DecisionInput, tariff: TariffWindow): number {
  const hoursToRun = input.irrigationVolumeLiters / input.pump.flowRateLitersPerHour;
  const kwh = hoursToRun * input.pump.powerKw;
  return kwh * tariff.pricePerKwh;
}

function projectedStressCost(
  soil: SoilState,
  crop: CropEconomics,
  projectedMoisture: number,
  hoursUntilCheap: number
): number {
  if (projectedMoisture > soil.criticalThreshold) return 0;
  const hoursAboveBuffer =
    (soil.currentMoisture - soil.criticalThreshold) / soil.depletionRatePerHour;
  const hoursInStress = Math.max(0, hoursUntilCheap - hoursAboveBuffer);
  let cost = crop.stressCostPerHour * Math.pow(hoursInStress, 2);
  const dangerBand = soil.criticalThreshold - soil.wiltingPoint;
  const intoDanger = soil.criticalThreshold - projectedMoisture;
  if (intoDanger > 0 && dangerBand > 0) {
    const dangerRatio = Math.min(1, intoDanger / dangerBand);
    cost *= 1 + crop.severityMultiplier * dangerRatio;
  }
  return cost;
}

export function decideIrrigation(input: DecisionInput): DecisionResult {
  const { soil, currentTariff, nextLowTariff, crop } = input;

  if (soil.currentMoisture <= soil.wiltingPoint) {
    return {
      decision: "EMERGENCY_IRRIGATE",
      reasoning:
        "Humedad en o por debajo del punto de marchitez. Riego inmediato; el coste energético es irrelevante frente al daño irreversible.",
      costNow: energyCost(input, currentTariff),
      costLater: 0,
      stressRiskCost: Infinity,
      netSavings: -Infinity,
    };
  }

  const hoursUntilCheap = nextLowTariff.startsInHours;
  const projectedMoisture =
    soil.currentMoisture - soil.depletionRatePerHour * hoursUntilCheap;

  const costNow = energyCost(input, currentTariff);
  const costLater = energyCost(input, nextLowTariff);
  const energySavings = costNow - costLater;
  const stressRiskCost = projectedStressCost(soil, crop, projectedMoisture, hoursUntilCheap);
  const netSavings = energySavings - stressRiskCost;

  if (projectedMoisture <= soil.criticalThreshold && netSavings <= 0) {
    return {
      decision: "IRRIGATE_NOW",
      reasoning: `Esperar ahorraría $${energySavings.toFixed(
        2
      )}, pero la planta caería a ${projectedMoisture.toFixed(
        1
      )}% (umbral ${soil.criticalThreshold}%), con coste de estrés $${stressRiskCost.toFixed(
        2
      )}. El riesgo supera el ahorro.`,
      costNow,
      costLater,
      stressRiskCost,
      netSavings,
    };
  }

  if (netSavings > 0) {
    return {
      decision: "WAIT",
      reasoning: `Se puede esperar ${hoursUntilCheap}h a la tarifa baja. Humedad proyectada ${projectedMoisture.toFixed(
        1
      )}%. Ahorro neto $${netSavings.toFixed(2)}.`,
      costNow,
      costLater,
      stressRiskCost,
      netSavings,
    };
  }

  return {
    decision: "IRRIGATE_NOW",
    reasoning: `El ahorro por esperar ($${energySavings.toFixed(
      2
    )}) no justifica el riesgo de estrés ($${stressRiskCost.toFixed(2)}). Regar ahora.`,
    costNow,
    costLater,
    stressRiskCost,
    netSavings,
  };
}
