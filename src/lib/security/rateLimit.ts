// ============================================================
// WaterSense — Rate limiting (gratis hoy, escalable mañana)
// ------------------------------------------------------------
// Limitador de peticiones por clave (IP, usuario…). Por defecto
// usa un contador EN MEMORIA: cero dependencias, cero costo, y
// suficiente mientras corras en pocas instancias.
//
// ⚠️ Límite conocido: la memoria NO se comparte entre instancias
// serverless de Vercel. Para límites globales reales (a escala),
// cambia la implementación de `hit()` por Upstash Redis:
//   npm i @upstash/ratelimit @upstash/redis
//   y lee UPSTASH_REDIS_REST_URL / _TOKEN (ver .env.example).
// El resto del código (las rutas) NO cambia: solo esta función.
// ============================================================

export interface RateLimitOptions {
  /** máximo de peticiones permitidas dentro de la ventana */
  limit: number;
  /** tamaño de la ventana en milisegundos */
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** peticiones restantes en la ventana actual */
  remaining: number;
  /** epoch ms en que se reinicia la ventana */
  resetAt: number;
}

type Bucket = { count: number; resetAt: number };

// Mapa global del proceso. Se reinicia con cada cold start (aceptable
// para protección básica anti-abuso; para algo global, usa Upstash).
const store = new Map<string, Bucket>();

/** Cuenta una petición para `key` y dice si está dentro del límite. */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.limit - 1, resetAt };
  }

  bucket.count += 1;
  const ok = bucket.count <= opts.limit;
  return { ok, remaining: Math.max(0, opts.limit - bucket.count), resetAt: bucket.resetAt };
}

/** Deriva una clave estable por cliente desde la IP de la petición. */
export function clientKey(req: Request, scope = "global"): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]!.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

/** Cabeceras estándar para devolver al cliente cuando se limita. */
export function rateLimitHeaders(r: RateLimitResult, limit: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(r.remaining),
    "X-RateLimit-Reset": String(Math.ceil(r.resetAt / 1000)),
    ...(r.ok ? {} : { "Retry-After": String(Math.max(1, Math.ceil((r.resetAt - Date.now()) / 1000))) }),
  };
}
