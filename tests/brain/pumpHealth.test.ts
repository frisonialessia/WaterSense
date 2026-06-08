import { describe, it, expect } from "vitest";
import { assessPump } from "@/lib/brain/pumpHealth";
import type { Well } from "@/types/domain";

function well(starts: number, ratedStarts: number): Well {
  return {
    id: "w1",
    name: "Pozo 1",
    currentFlowLph: 10000,
    sustainableFlowLph: 12000,
    depthM: 80,
    ratedStarts,
    starts,
    ok: true,
  };
}

describe("assessPump", () => {
  it("sano con pocos arranques y sin caída de presión", () => {
    const r = assessPump(well(10, 1000), 0);
    expect(r.status).toBe("ok");
    expect(r.health).toBeGreaterThan(90);
    expect(r.monthsToFailure).toBeNull();
  });

  it("advierte con vida casi agotada", () => {
    const r = assessPump(well(950, 1000), 0);
    expect(r.status).toBe("warn");
    expect(r.monthsToFailure).not.toBeNull();
  });

  it("crítico con vida agotada y caída de presión", () => {
    const r = assessPump(well(1000, 1000), 25);
    expect(r.status).toBe("critical");
    expect(r.health).toBeLessThan(20);
  });
});
