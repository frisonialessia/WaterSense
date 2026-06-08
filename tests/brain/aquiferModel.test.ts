import { describe, it, expect } from "vitest";
import { projectAquifer, type AquiferInputs } from "@/lib/brain/aquiferModel";

const base: AquiferInputs = {
  startLevelM: 78,
  criticalLevelM: 140,
  rechargeMPerYear: 2.2,
  baseExtractionM: 3.4,
  extractionFactor: 1,
  neighbors: 3,
  neighborDrawM: 0.9,
  rainReuse: 0,
  drainReuse: 0,
  rechargeMAR: 0,
  wastewaterReuse: 0,
  runoffCapture: 0,
  horizonYears: 30,
  baseYear: 2025,
};

describe("projectAquifer", () => {
  it("sobrevive el horizonte con extracción mínima y sin vecinos", () => {
    const r = projectAquifer({ ...base, extractionFactor: 0, neighbors: 0 });
    expect(r.survives).toBe(true);
    expect(r.limitYear).toBeNull();
  });

  it("colapsa con extracción alta y muchos vecinos", () => {
    const r = projectAquifer({ ...base, extractionFactor: 1, neighbors: 10 });
    expect(r.survives).toBe(false);
    expect(r.limitYear).not.toBeNull();
    expect(r.annualDropM).toBeGreaterThan(0);
  });

  it("el reúso reduce el abatimiento anual", () => {
    const sin = projectAquifer(base);
    const con = projectAquifer({ ...base, rechargeMAR: 1, drainReuse: 1 });
    expect(con.annualDropM).toBeLessThan(sin.annualDropM);
  });
});
