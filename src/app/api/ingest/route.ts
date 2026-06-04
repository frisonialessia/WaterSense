// GET /api/ingest — PLANTILLA de ingesta a la tabla `readings` (Supabase).
// La idea: un cron llama esto cada cierto tiempo, jala datos de fuentes
// externas (CENACE, clima, CONAGUA…) y los guarda como serie temporal.
// La app luego LEE de `readings` (rápido, estable) en vez de pegarle a las
// APIs frágiles en cada request.
//
// Seguro por defecto: si Supabase no está configurado, no hace nada.
// Protégelo con CRON_SECRET (Vercel Cron manda Authorization: Bearer <secret>).
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST /api/ingest — recibe UNA lectura (sensor o captura manual del productor)
// y la guarda en `readings`. Cuerpo: { source, metric, value, unit?, ranch_id? }.
// Ej. nivel del pozo capturado a mano, arranques, kWh, caudal medido.
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let b: { source?: string; metric?: string; value?: number; unit?: string; ranch_id?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!b.metric || typeof b.value !== "number") {
    return NextResponse.json({ error: "Faltan 'metric' y/o 'value' numérico" }, { status: 400 });
  }
  if (!url || !key) {
    return NextResponse.json({ stored: false, reason: "Supabase no configurado (.env). Lectura recibida pero no persistida." });
  }
  const sb = createClient(url, key);
  const { error } = await sb.from("readings").insert({
    ranch_id: b.ranch_id ?? process.env.DEMO_RANCH_ID ?? null,
    source: b.source ?? "manual",
    metric: b.metric,
    value: b.value,
    unit: b.unit ?? null,
    recorded_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ stored: false, error: error.message }, { status: 500 });
  return NextResponse.json({ stored: true });
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
