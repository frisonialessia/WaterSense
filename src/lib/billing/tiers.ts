// ============================================================
// WaterSense — Membresías (catálogo, sin cobrar todavía)
// ------------------------------------------------------------
// Define los 3 planes y sus LÍMITES/FEATURES en un solo lugar.
// No requiere Stripe ni cobrar nada: es el catálogo que la app
// usará para mostrar precios y para "gatear" funciones por plan.
//
// Cuando quieras cobrar (Fase 1):
//   npm i stripe
//   crea los Products/Prices en Stripe con estos mismos `id`,
//   guarda el plan activo en `organizations.plan` y compáralo con
//   TIERS[plan] usando hasFeature()/withinLimit(). Nada más cambia.
// ============================================================

export type TierId = "productor" | "profesional" | "distrito";

/** Roles dentro de una organización (mapean a memberships.role en la BD). */
export type MembershipRole = "owner" | "admin" | "member" | "viewer";

export interface TierLimits {
  /** ranchos máximos por organización (Infinity = sin tope) */
  maxRanches: number;
  /** miembros (usuarios) máximos por organización */
  maxMembers: number;
  /** mensajes/día al asistente IA */
  agentMessagesPerDay: number;
  /** telemetría de sensores (ingesta a `readings`) */
  telemetry: boolean;
  /** cumplimiento hídrico (CONAGUA/REPDA, índice de concesión) */
  compliance: boolean;
  /** alertas por WhatsApp/SMS (Twilio) */
  whatsappAlerts: boolean;
  /** acceso a la API pública */
  api: boolean;
  /** inicio de sesión único (SSO) */
  sso: boolean;
  /** agregación regional por acuífero/distrito */
  regionalAggregation: boolean;
}

export interface Tier {
  id: TierId;
  name: string;
  audience: string;
  /** resumen de una línea para la tarjeta de precios */
  tagline: string;
  /** precio orientativo MXN/mes (ajústalo a tu mercado; 0 = a cotizar) */
  priceMxnMonthly: number;
  /** precio MXN/año (recomendado: 10× el mensual = 2 meses gratis; 0 = a cotizar) */
  priceMxnAnnual: number;
  /** días de prueba gratis al iniciar (0 = sin prueba) */
  trialDays: number;
  /** destacar como "el más popular" en la página de precios */
  popular: boolean;
  /** texto del botón de acción */
  cta: string;
  limits: TierLimits;
  /** bullets para la página de precios */
  features: string[];
}

const INF = Number.POSITIVE_INFINITY;

export const TIERS: Record<TierId, Tier> = {
  productor: {
    id: "productor",
    name: "Productor",
    audience: "Agricultor individual",
    tagline: "Decide con fecha y precio, no a ojo.",
    priceMxnMonthly: 499,
    priceMxnAnnual: 4990, // 10 meses → 2 gratis
    trialDays: 14,
    popular: false,
    cta: "Empezar prueba",
    limits: {
      maxRanches: 3,
      maxMembers: 1,
      agentMessagesPerDay: 20,
      telemetry: false,
      compliance: false,
      whatsappAlerts: false,
      api: false,
      sso: false,
      regionalAggregation: false,
    },
    features: [
      "Hasta 3 ranchos",
      "Captura manual de costos, pozos y parcelas",
      "Clima y precio de luz en vivo",
      "Asistente IA (20 mensajes/día)",
      "Proyección del acuífero y decisión de riego",
    ],
  },
  profesional: {
    id: "profesional",
    name: "Profesional / Agroempresa",
    audience: "Empresa agrícola con varios ranchos",
    tagline: "Tu equipo, tus sensores y tu cumplimiento, en un solo lugar.",
    priceMxnMonthly: 2900,
    priceMxnAnnual: 29000, // 10 meses → 2 gratis
    trialDays: 14,
    popular: true,
    cta: "Probar 14 días gratis",
    limits: {
      maxRanches: 25,
      maxMembers: 10,
      agentMessagesPerDay: 200,
      telemetry: true,
      compliance: true,
      whatsappAlerts: true,
      api: false,
      sso: false,
      regionalAggregation: false,
    },
    features: [
      "Todo lo de Productor, y además:",
      "Hasta 25 ranchos y 10 usuarios con roles",
      "Telemetría de sensores (nivel, caudal, presión, kWh)",
      "Cumplimiento CONAGUA/REPDA (índice de concesión)",
      "Alertas por WhatsApp · Asistente IA (200 msg/día)",
    ],
  },
  distrito: {
    id: "distrito",
    name: "Distrito / Enterprise",
    audience: "Distritos de riego, gobierno, cooperativas",
    tagline: "Una región entera, con trazabilidad para CONAGUA.",
    priceMxnMonthly: 0, // a cotizar
    priceMxnAnnual: 0, // a cotizar
    trialDays: 0,
    popular: false,
    cta: "Hablar con ventas",
    limits: {
      maxRanches: INF,
      maxMembers: INF,
      agentMessagesPerDay: INF,
      telemetry: true,
      compliance: true,
      whatsappAlerts: true,
      api: true,
      sso: true,
      regionalAggregation: true,
    },
    features: [
      "Todo lo de Profesional, y además:",
      "Ranchos y usuarios ilimitados",
      "Agregación regional por acuífero",
      "API y SSO (inicio de sesión único)",
      "Soporte y SLA dedicados",
    ],
  },
};

export const DEFAULT_TIER: TierId = "productor";

export function tierOf(id: string | null | undefined): Tier {
  return TIERS[(id as TierId)] ?? TIERS[DEFAULT_TIER];
}

/** ¿El plan incluye esta función booleana? */
export function hasFeature(
  tier: Tier,
  key: { [K in keyof TierLimits]: TierLimits[K] extends boolean ? K : never }[keyof TierLimits]
): boolean {
  return tier.limits[key] === true;
}

/** ¿`current` está dentro del límite numérico del plan? (`<` para "puedo agregar uno más"). */
export function withinLimit(
  tier: Tier,
  key: { [K in keyof TierLimits]: TierLimits[K] extends number ? K : never }[keyof TierLimits],
  current: number
): boolean {
  return current < (tier.limits[key] as number);
}

/** Meses gratis al pagar anual (vs 12× el mensual). 0 si no aplica. */
export function annualMonthsFree(tier: Tier): number {
  if (tier.priceMxnMonthly <= 0 || tier.priceMxnAnnual <= 0) return 0;
  const free = 12 - tier.priceMxnAnnual / tier.priceMxnMonthly;
  return Math.max(0, Math.round(free));
}

/** ¿La prueba gratis sigue vigente? `trialEndsAt` = ISO date o null. */
export function isTrialActive(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false;
  const end = Date.parse(trialEndsAt);
  return Number.isFinite(end) && end > Date.now();
}

/** Formatea un precio MXN para la UI (sin decimales). */
export function formatMxn(amount: number): string {
  return amount.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}
