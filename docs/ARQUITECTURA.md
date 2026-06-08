# WaterSense — Arquitectura y cimientos para escalar

Este documento resume la **Fase 0** (cimientos que se hicieron sin pagar nada)
y deja la **lista de activación** de cada servicio para cuando decidas dar el
salto a SaaS real. Todo lo nuevo es *inerte sin configuración*: el demo sigue
funcionando con datos simulados y cero claves.

---

## Qué se implementó (gratis, ya en el código)

| Área | Antes | Ahora |
|---|---|---|
| **Multi-tenancy** | Repositorio singleton global, sin usuario | `getRepository(ctx)` scopeado al tenant (`src/lib/data/repository.ts`) |
| **Aislamiento de datos** | RLS por `user_id`, ignorado por service role | RLS por **organización + rol** (`supabase/schema.sql`) usando el JWT del usuario |
| **Modelo de negocio** | — | 3 membresías con límites y features (`src/lib/billing/tiers.ts`) |
| **Validación de entrada** | `as` (sin validar) | `zod` por endpoint (`src/lib/validation/schemas.ts`) |
| **Abuso / costo de IA** | Endpoints abiertos | Rate limit por IP (`src/lib/security/rateLimit.ts`) |
| **IDOR en ingesta** | `ranch_id` venía del cliente | Se deriva del contexto autenticado; ingesta exige auth |
| **Cabeceras de seguridad** | Ninguna | HSTS, X-Frame-Options, nosniff… (`next.config.js`) |
| **Calidad** | Sin tests ni CI | Vitest (19 pruebas) + GitHub Actions (`.github/workflows/ci.yml`) |
| **Observabilidad** | `console` suelto | Logger estructurado, seam para Sentry (`src/lib/observability/logger.ts`) |

### El cambio clave: `getRepository(ctx)`

El backend ahora puede saber **quién** pide los datos. En el demo (sin login)
cae al repositorio simulado. Con Supabase + un usuario autenticado, devuelve un
`SupabaseRepository` creado con el **JWT del usuario**, de modo que las políticas
RLS aíslan los datos por organización. El mismo código sirve para hoy y para el
SaaS multi-tenant de mañana.

---

## Lista de activación (cuando decidas pagar/crear cuentas)

### 1. Base de datos real + login — Supabase (tiene capa gratis)
1. Crea proyecto en supabase.com y corre `supabase/schema.sql` (ya trae
   organizaciones, membresías, roles y RLS por org).
2. Pon `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`.
3. **Fase 1 pendiente (no incluida porque requiere el proyecto vivo):**
   - `npm i @supabase/ssr` + `middleware.ts` para sesión por cookies.
   - En `src/lib/security/authContext.ts`, resolver `orgId`/`role` reales desde
     la tabla `memberships` (hay un `TODO` marcando el punto exacto).
   - UI de login/registro y de "crear organización".

### 2. Cobros — Stripe
- `npm i stripe`. Crea Products/Prices con los `id` de `tiers.ts`
  (`productor`, `profesional`, `distrito`).
- Guarda el plan en `organizations.plan` y compáralo con `withinLimit()` /
  `hasFeature()` para gatear funciones. Variables en `.env.example`.

### 3. Rate limiting global — Upstash Redis (capa gratis)
- Solo necesario a escala (varias instancias). `npm i @upstash/ratelimit
  @upstash/redis` y reescribe `hit()` en `rateLimit.ts`. Las rutas no cambian.

### 4. Errores/trazas — Sentry (capa gratis)
- `npm i @sentry/nextjs` y reenvía `logger.error` a `Sentry.captureException`.

### 5. Conexiones a escala — Supabase Supavisor
- Cuando tengas miles de peticiones concurrentes, usa el pooler en modo
  transacción (incluido en Supabase). Sin cambios de código.

---

## Lo que deliberadamente NO se hizo (y por qué)

- **No** se conectó Supabase ni se cobró: requiere cuentas/decisiones tuyas y
  romper el "cero-config". Quedó todo cableado para activarse en horas.
- **No** se optimizó para 100k usuarios (caché agresiva, colas, read replicas):
  con 0 usuarios sería optimización prematura. Son palancas de **Fase 3**,
  cuando la tracción lo pida.
- **No** se añadió `next lint` al CI para no bloquear por reglas de estilo en
  código existente; el CI valida tipos, pruebas y build (lo que de verdad rompe).

---

## Comandos

```bash
npm run dev         # demo, sin claves
npm run typecheck   # tipos
npm test            # pruebas (Vitest)
npm run build       # build de producción
```
