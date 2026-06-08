import { describe, it, expect } from "vitest";
import { decideIrrigation, type DecisionInput } from "@/lib/brain/decisionEngine";

const pump = { flowRateLitersPerHour: 1000, powerKw: 5 };
const base: DecisionInput = {
  soil: { currentMoisture: 60, criticalThreshold: 30, wiltingPoint: 15, depletionRatePerHour: 1 },
  currentTariff: { pricePerKwh: 2, startsInHours: 0, durationHours: 2 },
  nextLowTariff: { pricePerKwh: 0.5, startsInHours: 4, durationHours: 4 },
  crop: { stressCostPerHour: 10, severityMultiplier: 1 },
  pump,
  irrigationVolumeLiters: 1000,
};

describe("decideIrrigation", () => {
  it("riega de emergencia bajo el punto de marchitez", () => {
    const r = decideIrrigation({ ...base, soil: { ...base.soil, currentMoisture: 15 } });
    expect(r.decision).toBe("EMERGENCY_IRRIGATE");
  });

  it("espera cuando hay ahorro neto y la humedad aguanta", () => {
    const r = decideIrrigation(base);
    expect(r.decision).toBe("WAIT");
    expect(r.netSavings).toBeGreaterThan(0);
  });

  it("riega ahora cuando el riesgo de estrés supera el ahorro", () => {
    const r = decideIrrigation({
      ...base,
      soil: { currentMoisture: 32, criticalThreshold: 30, wiltingPoint: 15, depletionRatePerHour: 5 },
    });
    expect(r.decision).toBe("IRRIGATE_NOW");
    expect(r.netSavings).toBeLessThanOrEqual(0);
  });
});
