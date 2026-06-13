// POST /api/agent — the field assistant.
// Works with ZERO config: without ANTHROPIC_API_KEY it answers with the
// local rule-based brain over the (simulated) repository data. With the key
// set, it uses Claude to reason freely. The key never reaches the browser.
//
// Endurecido: rate limit por IP (protege tu presupuesto de Anthropic ante
// abuso) + validación de entrada (zod) + repositorio scopeado al tenant.
import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data/repository";
import { getTenantContextFromRequest } from "@/lib/security/authContext";
import { localAgentAnswer } from "@/lib/brain/localAgent";
import { agentSchema, parseJson } from "@/lib/validation/schemas";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rateLimit";
import { logger } from "@/lib/observability/logger";

const LIMIT = 20; // mensajes por ventana
const WINDOW_MS = 60_000; // 1 minuto

export async function POST(req: NextRequest) {
  // 1) Rate limit por IP — barato y protege el costo de IA.
  const rl = rateLimit(clientKey(req, "agent"), { limit: LIMIT, windowMs: WINDOW_MS });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas peticiones. Intenta en un momento." },
      { status: 429, headers: rateLimitHeaders(rl, LIMIT) }
    );
  }

  // 2) Validación de entrada.
  const parsed = await parseJson(req, agentSchema);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400, headers: rateLimitHeaders(rl, LIMIT) });
  }
  const { messages } = parsed.data;
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  // 3) Datos del rancho desde el repositorio scopeado al tenant (demo → simulado).
  const ctx = await getTenantContextFromRequest(req);
  const repo = getRepository(ctx);
  const [parcels, wells, costs, savings, crops, tariffCurve, aquifer] = await Promise.all([
    repo.getParcels(),
    repo.getWells(),
    repo.getCosts(),
    repo.getSavings(),
    repo.getCrops(),
    repo.getTariffCurve(),
    repo.getAquiferNeighborhood(),
  ]);
  const facts = { parcels, wells, costs, savings, crops, tariffCurve, aquifer };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Sin clave → fallback local, así el PoC siempre funciona.
  if (!apiKey) {
    return NextResponse.json(
      { text: localAgentAnswer(lastUser, facts), mode: "local" },
      { headers: rateLimitHeaders(rl, LIMIT) }
    );
  }

  const system = `Eres el asistente de WaterSense para un agricultor de Chihuahua. Responde claro y breve (2-4 frases), en español, sin jerga.
PARCELAS: ${parcels.map((p) => `${p.name} (${p.crop}, ${p.hectares}ha, sed ${(p.stress * 100).toFixed(0)}%)`).join("; ")}.
POZOS: ${wells.map((w) => `${w.name} (${w.currentFlowLph}/${w.sustainableFlowLph} L/h, ${w.ok ? "bien" : "sobre el límite"})`).join("; ")}.
Recuerda: todos los datos son simulados (demostración). Si te preguntan algo fuera de estos datos, acláralo con honestidad.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system,
        messages,
      }),
    });
    const data = await res.json();
    const text =
      (data.content ?? [])
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("\n") || localAgentAnswer(lastUser, facts);
    return NextResponse.json({ text, mode: "claude" }, { headers: rateLimitHeaders(rl, LIMIT) });
  } catch (e) {
    // network/API failure → still answer locally
    logger.warn("agent: fallo llamando a Anthropic, usando fallback local", { error: String(e) });
    return NextResponse.json(
      { text: localAgentAnswer(lastUser, facts), mode: "local" },
      { headers: rateLimitHeaders(rl, LIMIT) }
    );
  }
}
