import { describe, it, expect } from "vitest";
import { TIERS, tierOf, hasFeature, withinLimit, annualMonthsFree, isTrialActive } from "@/lib/billing/tiers";

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

  it("el plan anual da 2 meses gratis (planes de pago)", () => {
    expect(annualMonthsFree(TIERS.productor)).toBe(2);
    expect(annualMonthsFree(TIERS.profesional)).toBe(2);
    expect(annualMonthsFree(TIERS.distrito)).toBe(0); // a cotizar
  });

  it("isTrialActive respeta la fecha de fin", () => {
    const futuro = new Date(Date.now() + 86_400_000).toISOString();
    const pasado = new Date(Date.now() - 86_400_000).toISOString();
    expect(isTrialActive(futuro)).toBe(true);
    expect(isTrialActive(pasado)).toBe(false);
    expect(isTrialActive(null)).toBe(false);
  });
});
