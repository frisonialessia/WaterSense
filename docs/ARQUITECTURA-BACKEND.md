# ADR-001 · Backend: Next.js integrado (BFF) vs backend independiente

**Estado:** Aceptada · **Fecha:** 2026-06 · **Decisor:** Arquitectura
**Contexto del producto:** WaterSense — SaaS de auditoría de riego para
agricultura de alto rendimiento en Chihuahua. Pre-lanzamiento, datos
simulados, repositorio como "swap seam" hacia Supabase.

## Decisión
**Mantener Next.js integrado (Route Handlers como BFF/API tier) + Supabase
(Postgres + Auth + RLS) sobre Vercel.** No se justifica un backend con
infraestructura independiente. Es un caso de **"menos es más"**.

## Análisis por factor

### 1. Complejidad del procesamiento → ligera
- El "cerebro" (`src/lib/brain/`: `aquiferModel`, `decisionEngine`,
  `pumpHealth`, `yieldModel`, `marketModel`) son **funciones puras de
  aritmética** (la proyección del acuífero es un loop de 30 iteraciones).
  Corre en microsegundos. Sin ML, video, ni estado en memoria de larga vida.
- Lo "lento" es **I/O, no CPU** (Anthropic, CENACE): encaja en serverless.
- Las fuentes frágiles ya se cachean con el patrón **cron → tabla `readings`**
  (`/api/ingest`), no se llaman por-request.
- **No** justifica un servidor de cómputo dedicado.

### 2. Seguridad y privacidad → la frontera que importa ya existe
- Los Route Handlers **corren server-side, fuera del navegador**: los secretos
  (API keys, service role) nunca llegan al cliente.
- El aislamiento entre tenants se resuelve con **Postgres RLS + JWT del usuario**
  (`getRepository(ctx)` → `SupabaseRepository` scopeado), no con un servidor
  separado. zod + rate-limit ya implementados.
- Datos moderadamente sensibles, **no PII regulada** (no salud/tarjetas).
- Un backend separado solo aportaría con VPC sin ingress / mTLS / SOC2-PCI-HIPAA.
  No es el caso hoy.

### 3. Escalabilidad a 10k usuarios → aguanta de sobra
- Las funciones de Vercel autoescalan; el cerebro es stateless. El cuello de
  botella **nunca es el cómputo — es la BD y las APIs externas**.
- Tres ajustes (config, no infra nueva) llevan esto a 10k–100k:
  1. **Supavisor** (pooling de conexiones) desde el día 1 de la BD.
  2. Patrón **cron → `readings`** para fuentes frágiles (ya existe).
  3. Paginación + índices + **vistas materializadas** para agregados.
- Para jobs pesados/batch (ingesta masiva, reportes para miles de ranchos):
  **agregar un worker async** (Inngest / Trigger.dev / Supabase Edge Functions)
  — complemento, no reemplazo del BFF.

## Consecuencias
- ✅ Velocidad de iteración, menos infra, menos superficie de ataque, costo bajo.
- ✅ El **patrón Repositorio** (`FarmRepository`) deja extraer un microservicio
  (geoespacial/ML) detrás del contrato, sin reescribir UI ni cerebro.
- ⚠️ Disciplina: lo que tarde >10s o sea batch va a un **worker async**, no en
  el Route Handler (límites de timeout/payload de Vercel).

## Cuándo revisar esta decisión ("la separación se vuelve obligatoria")
1. Procesamiento **geoespacial propio** (tilear rasters satelitales, no consumir
   OpenET/NDVI como API) → servicio dedicado.
2. **Ingesta IoT masiva** (millones de mensajes/min) → broker + pipeline aparte.
3. **Compliance enterprise/gobierno** (VPC, on-prem, SOC2/aislamiento de red).

Todas son futuras, impulsadas por un deal concreto, y **quirúrgicas** gracias al
patrón Repositorio. No anticiparlas.
