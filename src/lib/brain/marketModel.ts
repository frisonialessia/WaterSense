// ============================================================
// WaterSense — Market outlook (cuándo vender la cosecha)
// Simulated seasonal price signal per crop: at harvest the market
// floods (price down); off-season it recovers (price up). Pure fn.
// Structured to swap for real commodity/market price feeds later.
// ============================================================

export interface MarketOutlook {
  currentPrice: number;
  avgPrice: number;
  /** months ahead with the best projected price (0 = now) */
  bestMonthOffset: number;
  bestMonthPrice: number;
  trend: "sube" | "baja" | "estable";
  /** true if selling now is a good window */
  sellNow: boolean;
  /** projected price for the next 8 months */
  curve: number[];
}

// deterministic phase per crop so each crop peaks in a different season
function phaseOf(crop: string): number {
  let h = 0;
  for (let i = 0; i < crop.length; i++) h = (h * 31 + crop.charCodeAt(i)) % 12;
  return h;
}

export function marketOutlook(basePrice: number, crop: string, monthNow: number, horizon = 8): MarketOutlook {
  const phase = phaseOf(crop);
  const price = (m: number) => Math.round(basePrice * (1 + 0.2 * Math.sin(((m - phase) / 12) * 2 * Math.PI)) * 100) / 100;

  const curve: number[] = [];
  for (let i = 0; i < horizon; i++) curve.push(price(monthNow + i));

  const currentPrice = curve[0];
  let bestMonthOffset = 0;
  for (let i = 1; i < curve.length; i++) if (curve[i] > curve[bestMonthOffset]) bestMonthOffset = i;
  const bestMonthPrice = curve[bestMonthOffset];

  const next = curve[1] ?? currentPrice;
  const trend: MarketOutlook["trend"] = next > currentPrice * 1.02 ? "sube" : next < currentPrice * 0.98 ? "baja" : "estable";
  // vender ahora si el precio actual está cerca del máximo del horizonte
  const sellNow = currentPrice >= bestMonthPrice * 0.97;

  return { currentPrice, avgPrice: basePrice, bestMonthOffset, bestMonthPrice, trend, sellNow, curve };
}
