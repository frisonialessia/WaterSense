// ============================================================
// WaterSense — Local agent (rule-based fallback)
// Pure function. Answers the farmer's question from the farm facts
// WITHOUT any external API, so the PoC works with zero keys.
// When ANTHROPIC_API_KEY is set, /api/agent uses Claude instead.
// ============================================================

import type { Parcel, Well, CostItem } from "@/types/domain";

export interface FarmFacts {
  parcels: Parcel[];
  wells: Well[];
  costs: CostItem[];
}

const fmt = (n: number) => n.toLocaleString("es-MX");

export function localAgentAnswer(question: string, f: FarmFacts): string {
  const s = (question || "").toLowerCase();
  const driest = [...f.parcels].sort((a, b) => b.stress - a.stress)[0];
  const overdrawn = f.wells.find((w) => !w.ok);
  const topCost = [...f.costs].sort((a, b) => b.month - a.month)[0];

  if (/(riego|regar|primero|prioridad|cu[aá]ndo|hora)/.test(s) && driest) {
    return `Riega primero la ${driest.name} (${driest.crop}): está al ${(driest.stress * 100).toFixed(0)}% de sed, la más seca. Hazlo de madrugada, cuando la luz es más barata — ahorras alrededor de $90.`;
  }

  if (/(pozo|acu[ ií]|alerta|bomba|caudal)/.test(s)) {
    if (overdrawn) {
      return `El ${overdrawn.name} está sacando ${fmt(overdrawn.currentFlowLph)} L/h cuando su límite sano es ${fmt(overdrawn.sustainableFlowLph)} L/h. Lo estás sobreexplotando: conviene bajar el ritmo o repartir el bombeo con otro pozo, o dañarás el pozo y la bomba.`;
    }
    return `Tus pozos están dentro de su límite sostenible ahora mismo. Conviene seguir vigilando arranques y presión para anticipar el mantenimiento.`;
  }

  if (/(luz|energ|gasto|barato|costo|ahorr|caro|dinero|cfe)/.test(s) && topCost) {
    const trend = topCost.trend < 0 ? `ya bajó ${Math.abs(topCost.trend)}%` : topCost.trend > 0 ? `subió ${topCost.trend}%` : "sin cambio";
    return `Tu mayor gasto es ${topCost.label}: $${fmt(topCost.month)}/mes (${trend}). Para bajarlo más: concentra el riego pesado entre la 1 y las 5 am y reparte el bombeo entre pozos para evitar picos de arranque.`;
  }

  if (/(parcela|cultivo|sano|salud|sed|estr[eé]s)/.test(s)) {
    const ok = f.parcels.filter((p) => p.stress < 0.5);
    const bad = f.parcels.filter((p) => p.stress >= 0.5);
    return `Tienes ${ok.length} de ${f.parcels.length} parcelas sanas. Requieren atención: ${bad.map((p) => `${p.name} (${(p.stress * 100).toFixed(0)}%)`).join(", ") || "ninguna"}.`;
  }

  return 'Puedo ayudarte con el riego, los pozos, los costos y la salud de tus parcelas. Por ejemplo: "¿qué parcela riego primero?" o "¿por qué el pozo chico está en alerta?". (Modo demo sin clave: respondo con reglas sobre tus datos simulados; con una ANTHROPIC_API_KEY conectada, el asistente razona libremente.)';
}
