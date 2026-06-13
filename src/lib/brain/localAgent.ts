// ============================================================
// WaterSense — Local agent (rule-based, sin API)
// Función pura: responde la pregunta del agricultor a partir de los datos
// del rancho, SIN ninguna API externa, para que la demo funcione sin claves.
// Con ANTHROPIC_API_KEY, /api/agent usa Claude y razona libremente.
// Cubre: riego, pozos, costos, ahorro, futuro del agua, cosecha/venta,
// huella, clima y saludos — todo con los números reales del rancho.
// ============================================================

import type { Parcel, Well, CostItem, SavingsSummary, CropProfile, AquiferNeighborhood } from "@/types/domain";

export interface FarmFacts {
  parcels: Parcel[];
  wells: Well[];
  costs: CostItem[];
  savings?: SavingsSummary;
  crops?: CropProfile[];
  tariffCurve?: number[];
  aquifer?: AquiferNeighborhood;
}

const fmt = (n: number) => Math.round(n).toLocaleString("es-MX");
const has = (s: string, re: RegExp) => re.test(s);

export function localAgentAnswer(question: string, f: FarmFacts): string {
  const s = (question || "").toLowerCase();
  const driest = [...f.parcels].sort((a, b) => b.stress - a.stress)[0];
  const overdrawn = f.wells.find((w) => !w.ok);
  const topCost = [...f.costs].sort((a, b) => b.month - a.month)[0];
  const total = f.costs.reduce((acc, c) => acc + c.month, 0);
  const cheapest = f.tariffCurve && f.tariffCurve.length ? f.tariffCurve.indexOf(Math.min(...f.tariffCurve)) : 2;
  const healthy = f.parcels.filter((p) => p.stress < 0.5).length;

  // ── Riego / cuándo / a qué hora ──
  if (has(s, /(riego|regar|riega|primero|prioridad|cu[aá]ndo|a qu[eé] hora|hora)/) && driest) {
    return `Riega primero la ${driest.name} (${driest.crop}): es la más seca, al ${(driest.stress * 100).toFixed(0)}% de sed. Hazlo de madrugada, a las ${cheapest}:00, que es la hora más barata de luz — riegas igual pero pagas menos.`;
  }

  // ── Futuro del agua / acuífero / años de pozo ──
  if (has(s, /(futuro|a[nñ]os?|d[eé]cada|se acaba|se agota|agotar|cu[aá]nto dura|sobrevive|sequ[ií]a|acu[ií]fero)/)) {
    const st = f.aquifer?.status ? f.aquifer.status.toLowerCase() : "bajo presión";
    const name = f.aquifer?.aquiferName ? ` (${f.aquifer.aquiferName})` : "";
    return `Tu acuífero${name} está ${st}: el agua baja año con año. Abre «Futuro del agua» y mueve las palancas (extracción, goteo, reúso) para ver en qué año dejaría de dar tu pozo… y cuántos años ganas si cambias el plan.`;
  }

  // ── Pozos / bombas / sobreexplotación ──
  if (has(s, /(pozo|bomba|caudal|arranque|sobreexplot|presi[oó]n|mantenim)/)) {
    if (overdrawn) {
      return `El ${overdrawn.name} saca ${fmt(overdrawn.currentFlowLph)} L/h y su límite sano es ${fmt(overdrawn.sustainableFlowLph)} L/h: lo estás sobreexplotando. Baja el ritmo o reparte el bombeo con otro pozo, o dañarás el pozo y la bomba antes de tiempo.`;
    }
    return `Tus pozos están dentro de su límite sostenible. Sigue vigilando arranques y presión en «Mis pozos» — ahí te avisamos de una falla de bomba antes de que pase.`;
  }

  // ── Ahorro / cuánto llevo ──
  if (has(s, /(ahorr|cu[aá]nto llevo|cu[aá]nto voy|ahorrando)/) && f.savings) {
    const trend = f.savings.vsLastMonthPct >= 0 ? `+${f.savings.vsLastMonthPct}% más que el mes pasado` : `${f.savings.vsLastMonthPct}% vs. el mes pasado`;
    return `Este mes llevas ahorrados $${fmt(f.savings.amountThisMonth)} en luz y agua (${trend}), frente a regar como antes. La mayor palanca es regar en la hora barata (a las ${cheapest}:00) y repartir el bombeo.`;
  }

  // ── Costos / luz / gasto ──
  if (has(s, /(luz|energ|gasto|barato|costo|caro|dinero|cfe|recibo)/) && topCost) {
    const trend = topCost.trend < 0 ? `ya bajó ${Math.abs(topCost.trend)}%` : topCost.trend > 0 ? `subió ${topCost.trend}%` : "sin cambio";
    return `Tu mayor gasto es ${topCost.label}: $${fmt(topCost.month)}/mes (${trend}); en total gastas ~$${fmt(total)}/mes. Para bajarlo: concentra el riego pesado entre la 1 y las 5 am y reparte el bombeo para evitar picos de arranque.`;
  }

  // ── Cosecha / vender / mercado ──
  if (has(s, /(vender|venta|precio|mercado|cosecha|cu[aá]nto vale|kilo)/)) {
    const main = f.crops && driest ? f.crops.find((c) => c.crop === driest.crop) : undefined;
    const any = main ?? (f.crops && f.crops[0]);
    if (any) {
      return `El ${any.crop.toLowerCase()} ronda los $${any.pricePerKg.toFixed(2)}/kg. Abre «Mi rancho» → «¿Cuándo vender?» para ver si conviene vender ahora o esperar una mejor ventana de precio.`;
    }
    return `En «Mi rancho» tienes «¿Cuándo vender?»: te dice si el precio de tu cultivo está alto o conviene esperar.`;
  }

  // ── Huella hídrica / sustentabilidad ──
  if (has(s, /(huella|tonelada|co2|carbono|sustent|ambient|certific)/)) {
    return `Tu huella hídrica (m³ de agua por tonelada) y la de carbono del bombeo (kgCO₂e/ton) están en «Costos». Son cada vez más pedidas por compradores y bancos (FIRA): riega eficiente y bajas las dos.`;
  }

  // ── Clima / lluvia ──
  if (has(s, /(clima|lluvia|llover|tiempo|temperatura|calor)/)) {
    return `El clima de los próximos días está en «Mi rancho» (clima real de Open-Meteo). Si viene lluvia, pausamos el riego de las parcelas que cubre — y te lo avisamos para que no riegues de más.`;
  }

  // ── Parcelas / salud / sed ──
  if (has(s, /(parcela|cultivo|sano|salud|sed|estr[eé]s)/)) {
    const bad = f.parcels.filter((p) => p.stress >= 0.5);
    return `Tienes ${healthy} de ${f.parcels.length} parcelas sanas. Requieren atención: ${bad.map((p) => `${p.name} (${(p.stress * 100).toFixed(0)}% de sed)`).join(", ") || "ninguna"}.`;
  }

  // ── Saludo ──
  if (has(s, /^(hola|buenas|buenos|qu[eé] tal|qu[eé] onda|hey|saludos)/)) {
    return `¡Hola! Soy tu asistente de WaterSense. Puedo decirte qué parcela regar primero, por qué un pozo está en alerta, cuánto llevas ahorrado o cuántos años le quedan a tu pozo. ¿Qué quieres saber?`;
  }

  // ── Gracias ──
  if (has(s, /(gracias|grac|perfecto|excelente)/)) {
    return `¡Con gusto! Cualquier cosa de tu riego, pozos o costos, aquí ando.`;
  }

  return 'Puedo ayudarte con el riego, los pozos, los costos, tu ahorro y el futuro de tu agua. Prueba: "¿qué parcela riego primero?", "¿cuánto llevo ahorrado?" o "¿cuántos años le quedan a mi pozo?". (Demo sin clave: respondo con reglas sobre tus datos simulados; con una ANTHROPIC_API_KEY, el asistente razona libremente.)';
}
