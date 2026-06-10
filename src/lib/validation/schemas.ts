// ============================================================
// WaterSense — Validación de entrada (zod)
// ------------------------------------------------------------
// Un esquema por endpoint. Antes los cuerpos JSON se casteaban con
// `as` (comportamiento indefinido ante payloads malformados). Ahora
// cada ruta valida y rechaza con 400 lo que no cumple el contrato.
// Beneficio extra: el cliente no puede inyectar campos no permitidos
// (p. ej. `ranch_id` en /api/ingest) porque el esquema los descarta.
// ============================================================

import { z } from "zod";

// ── /api/agent ────────────────────────────────────────────
export const agentSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(50),
});
export type AgentBody = z.infer<typeof agentSchema>;

// ── /api/ingest (POST) ─────────────────────────────────────
// Nota de seguridad: NO se acepta `ranch_id` del cliente. El rancho
// se deriva del contexto autenticado en el servidor (anti-IDOR).
export const ingestSchema = z.object({
  source: z.string().max(40).optional(),
  metric: z.string().min(1).max(40),
  value: z.number().finite(),
  unit: z.string().max(16).optional(),
});
export type IngestBody = z.infer<typeof ingestSchema>;

// ── /api/notify ────────────────────────────────────────────
export const notifySchema = z.object({
  to: z.string().max(32).optional(),
  body: z.string().min(1).max(1000),
});
export type NotifyBody = z.infer<typeof notifySchema>;

// ── /api/study ─────────────────────────────────────────────
export const studySchema = z.object({
  ranchName: z.string().max(120).optional(),
});
export type StudyBody = z.infer<typeof studySchema>;

// ── /api/aquifer ───────────────────────────────────────────
const unit = z.number().min(0).max(1);
export const aquiferSchema = z.object({
  extractionFactor: z.number().min(0).max(3).optional(),
  irrigationTech: unit.optional(),
  neighbors: z.number().int().min(0).max(1000).optional(),
  rainReuse: unit.optional(),
  drainReuse: unit.optional(),
  rechargeMAR: unit.optional(),
  wastewaterReuse: unit.optional(),
  runoffCapture: unit.optional(),
});
export type AquiferBody = z.infer<typeof aquiferSchema>;

// ── /api/decision ──────────────────────────────────────────
export const decisionSchema = z.object({
  soil: z.object({
    currentMoisture: z.number(),
    criticalThreshold: z.number(),
    wiltingPoint: z.number(),
    depletionRatePerHour: z.number(),
  }),
  currentTariff: z.object({
    pricePerKwh: z.number(),
    startsInHours: z.number(),
    durationHours: z.number(),
  }),
  nextLowTariff: z.object({
    pricePerKwh: z.number(),
    startsInHours: z.number(),
    durationHours: z.number(),
  }),
  crop: z.object({
    stressCostPerHour: z.number(),
    severityMultiplier: z.number(),
  }),
  pump: z.object({
    flowRateLitersPerHour: z.number().positive(),
    powerKw: z.number(),
  }),
  irrigationVolumeLiters: z.number().positive(),
});
export type DecisionBody = z.infer<typeof decisionSchema>;

/**
 * Lee y valida el cuerpo JSON de un request contra un esquema zod.
 * Devuelve `{ ok, data }` o `{ ok:false, error }` (mensaje legible).
 */
export async function parseJson<T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, error: "JSON inválido" };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, error: first ? `${first.path.join(".")}: ${first.message}` : "Datos inválidos" };
  }
  return { ok: true, data: result.data };
}
