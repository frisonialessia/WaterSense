// ============================================================
// WaterSense — Observabilidad (seam listo para Sentry)
// ------------------------------------------------------------
// Logger estructurado, sin dependencias ni costo. Hoy escribe a
// consola (JSON). El día que quieras trazas/errores reales:
//   npm i @sentry/nextjs && npx @sentry/wizard@latest -i nextjs
//   pon SENTRY_DSN en .env y reenvía `error()` a Sentry.captureException.
// Las llamadas en el código (logger.error/...) NO cambian.
// ============================================================

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({ level, msg, ...meta, t: new Date().toISOString() });
  // TODO(Fase 1): si SENTRY_DSN está configurado, reenviar errores aquí.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (process.env.NODE_ENV !== "production") console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
