// ============================================================
// WaterSense — Alert builder (pure logic)
// Turns the current state of wells, pump health and aquifer
// neighbors into plain-language alerts. Reused by the UI (preview)
// and by /api/notify (WhatsApp/SMS delivery). No I/O here.
// ============================================================

import type { Well, AquiferNeighborhood } from "@/types/domain";
import type { PumpHealth } from "./pumpHealth";

export interface Alert {
  severity: "info" | "watch" | "urgent";
  title: string;
  message: string;
}

export function buildAlerts(wells: Well[], pumps: PumpHealth[], aquifer: AquiferNeighborhood): Alert[] {
  const alerts: Alert[] = [];
  const byId = new Map(pumps.map((p) => [p.wellId, p]));

  for (const w of wells) {
    const p = byId.get(w.id);
    if (p?.status === "critical") {
      alerts.push({ severity: "urgent", title: `${w.name}: falla inminente`, message: `⚠️ ${w.name} tiene ${p.lifeUsedPct}% de vida usada y riesgo alto de falla. Agenda mantenimiento esta semana para no quedarte sin riego en plena temporada.` });
    } else if (p?.status === "warn") {
      alerts.push({ severity: "watch", title: `${w.name}: desgaste`, message: `🔧 ${w.name} muestra desgaste (${p.lifeUsedPct}% de vida). Conviene revisarlo pronto.` });
    }
    if (w.currentFlowLph > w.sustainableFlowLph) {
      alerts.push({ severity: "watch", title: `${w.name}: sobre el límite`, message: `💧 ${w.name} extrae ${w.currentFlowLph.toLocaleString("es-MX")} L/h, por encima de su caudal sostenible (${w.sustainableFlowLph.toLocaleString("es-MX")} L/h). Baja el bombeo para cuidar el pozo.` });
    }
  }

  for (const c of aquifer.concessions.filter((x) => (x.levelTrendMPerYear ?? 0) <= -2.0)) {
    alerts.push({ severity: "watch", title: "Vecino: abatimiento acelerado", message: `📉 ${c.titular} (a ${c.distanceKm} km) baja el nivel ${Math.abs(c.levelTrendMPerYear ?? 0)} m/año. Posible sobreextracción cercana — vigila tu nivel y reparte tu bombeo.` });
  }

  return alerts;
}

/** Format the alerts as a single WhatsApp/SMS message. */
export function alertsToMessage(alerts: Alert[], ranchName = "tu rancho"): string {
  if (!alerts.length) return `✅ WaterSense · ${ranchName}\nTodo en orden hoy. Sin alertas en tus pozos ni en el acuífero.`;
  const body = alerts.map((a) => `• ${a.message}`).join("\n\n");
  return `🌊 WaterSense · ${ranchName}\n${alerts.length} alerta(s) hoy:\n\n${body}`;
}
