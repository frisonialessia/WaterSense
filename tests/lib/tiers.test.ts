import { describe, it, expect } from "vitest";
import { TIERS, tierOf, hasFeature, withinLimit } from "@/lib/billing/tiers";

describe("tiers", () => {
  it("define los 3 planes", () => {
    expect(Object.keys(TIERS)).toEqual(["productor", "profesional", "distrito"]);
  });

  it("tierOf cae al plan por defecto ante valores inválidos", () => {
    expect(tierOf("inexistente").id).toBe("productor");
    expect(tierOf(null).id).toBe("productor");
  });

  it("withinLimit respeta el tope de ranchos", () => {
    expect(withinLimit(TIERS.productor, "maxRanches", 2)).toBe(true);
    expect(withinLimit(TIERS.productor, "maxRanches", 3)).toBe(false);
    expect(withinLimit(TIERS.distrito, "maxRanches", 10_000)).toBe(true); // ilimitado
  });

  it("hasFeature distingue telemetría por plan", () => {
    expect(hasFeature(TIERS.productor, "telemetry")).toBe(false);
    expect(hasFeature(TIERS.profesional, "telemetry")).toBe(true);
    expect(hasFeature(TIERS.distrito, "api")).toBe(true);
  });
});
