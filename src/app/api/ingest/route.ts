// /api/ingest — ingesta a la tabla `readings` (Supabase).
// GET  → cron: jala datos de fuentes externas (clima, etc.) y los guarda.
// POST → recibe UNA lectura (sensor o captura manual) y la guarda.
//
// La app luego LEE de `readings` (rápido, estable) en vez de pegarle a las
// APIs frágiles en cada request.
//
// Seguridad (endurecido):
//   • Sin Supabase configurado → no persiste nada (modo demo).
//   • POST: el `ranch_id` ya NO se acepta del cliente (anti-IDOR). Se deriva
//     del contexto autenticado; para persistir se exige sesión de usuario o
//     un token de dispositivo (INGEST_TOKEN). Rate limit por IP.
//   • GET: protegido con CRON_SECRET (Vercel Cron manda Authorization: Bearer).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTenantContextFromRequest } from "@/lib/security/authContext";
import { ingestSchema, parseJson } from "@/lib/validation/schemas";
import { rateLimit, clientKey, rateLimitHeaders } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

const LIMIT = 120; // lecturas por minuto por IP
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const rl = rateLimit(clientKey(req, "ingest"), { limit: LIMIT, windowMs: WINDOW_MS });
  if (!rl.ok) {
    return NextResponse.json({ error: "Demasiadas lecturas." }, { status: 429, headers: rateLimitHeaders(rl, LIMIT) });
  }

  const parsed = await parseJson(req, ingestSchema);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const b = parsed.data;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ stored: false, reason: "Supabase no configurado (.env). Lectura recibida pero no persistida." });
  }

  // Para PERSISTIR se exige identidad: usuario autenticado (JWT) o un token
  // de dispositivo (INGEST_TOKEN). Sin esto, cualquiera podría envenenar la BD.
  const ctx = await getTenantContextFromRequest(req);
  const deviceToken = process.env.INGEST_TOKEN;
  const authz = req.headers.get("authorization") ?? "";
  const isDevice = Boolean(deviceToken) && authz === `Bearer ${deviceToken}`;
  if (!ctx && !isDevice) {
    return NextResponse.json(
      { error: "Ingesta requiere autenticación (sesión de usuario o token de dispositivo)." },
      { status: 401 }
    );
  }

  // El rancho NUNCA viene del cuerpo. Se deriva del contexto / configuración.
  // TODO(Fase 1): resolver el ranch_id real desde la membresía del usuario (ctx.orgId).
  const ranchId = process.env.DEMO_RANCH_ID ?? null;

  const sb = createClient(url, key);
  const { error } = await sb.from("readings").insert({
    ranch_id: ranchId,
    source: b.source ?? "manual",
    metric: b.metric,
    value: b.value,
    unit: b.unit ?? null,
    recorded_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ stored: false, error: error.message }, { status: 500 });
  return NextResponse.json({ stored: true }, { headers: rateLimitHeaders(rl, LIMIT) });
}

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ skipped: "Supabase no configurado (.env)." });
  }

  // Protección opcional con secreto
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const sb = createClient(url, key);
  const now = new Date().toISOString();
  const ranchId = process.env.DEMO_RANCH_ID ?? null; // null = lectura global
  const rows: { ranch_id: string | null; source: string; metric: string; value: number; unit: string; recorded_at: string }[] = [];

  // ── Clima (Open-Meteo, gratis) → lluvia de hoy ──
  try {
    const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=28.19&longitude=-105.47&daily=precipitation_sum&forecast_days=1&timezone=auto", { signal: AbortSignal.timeout(8000) });
    const d = await r.json();
    const rain = d?.daily?.precipitation_sum?.[0];
    if (typeof rain === "number") rows.push({ ranch_id: ranchId, source: "weather", metric: "rain_mm", value: rain, unit: "mm", recorded_at: now });
  } catch {
    /* fuente caída: seguimos */
  }

  // ── Energía (CENACE, mejor esfuerzo) → precio actual ──
  // TODO: parsear PML real; aquí va el promedio del día si responde.
  // (CENACE suele bloquear hosts de nube; por eso esto vive en un cron.)

  // ── TODO: CONAGUA piezometría (nivel del acuífero), REPDA, sensores ──

  if (rows.length === 0) {
    return NextResponse.json({ ingested: 0, note: "Sin datos nuevos de las fuentes." });
  }
  const { error } = await sb.from("readings").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ingested: rows.length, at: now });
}
