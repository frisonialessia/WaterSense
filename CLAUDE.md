# WaterSense — Contexto para Claude Code

> Pégalo o léelo al iniciar una sesión nueva. Resume qué es el proyecto,
> qué está hecho, cómo se trabaja y qué falta para volverlo un SaaS real.

## Qué es
**WaterSense** — auditor de riego y "futuro del agua" para **agricultura de
alto rendimiento en Chihuahua, México** (nogal pecanero, manzana, chile…).
Cruza **costo de luz (CENACE), desperdicio de agua y salud del cultivo** para
decir **qué regar, cuándo, a qué hora**, y **cuántos años le quedan al pozo**.
El dolor real chihuahuense: acuíferos sobreexplotados + concesiones vigiladas
por CONAGUA (pasarse del volumen = sanción).

- **Modelo de negocio:** 3 membresías (Productor $499/mes · Profesional
  $2,900/mes · Distrito a cotizar), prueba 14 días. Definidas en
  `src/lib/billing/tiers.ts`. Aún **no se cobra** (sin Stripe).
- **Estado:** **demo/PoC pre-lanzamiento, 0 usuarios reales.** Datos
  **simulados** (rangos reales de Chihuahua). Los cambios del usuario viven
  en **localStorage**, no en servidor.

## Stack
Next.js 14 (App Router) + TypeScript, desplegado en **Vercel**. MapLibre
(mapa), Recharts (gráficas), zod (validación), Vitest (tests). Fuentes vivas:
Open-Meteo (clima) y CENACE (precio luz) vía rutas API; el "cerebro" corre
server-side con datos simulados. **Anthropic (Claude)** es opcional en
`/api/agent` y `/api/study`; sin clave hay fallback por reglas.

## Arquitectura clave (no romper)
- **Repositorio = el "swap seam":** `src/lib/data/repository.ts` →
  `getRepository(ctx?)`. Hoy devuelve `SimulatedRepository`. Con Supabase +
  usuario autenticado devolvería `SupabaseRepository` scopeado por JWT (RLS).
  Toda la app lee del contrato `FarmRepository`.
- **Multi-tenancy listo pero inerte:** `supabase/schema.sql` tiene
  organizations + memberships + roles + RLS por organización;
  `src/lib/security/authContext.ts` resuelve el tenant (devuelve null sin
  Supabase → modo demo). Auth UI y `@supabase/ssr` middleware: **pendientes**.
- **Paleta:** TODO el color sale de `src/lib/theme.ts` (tokens `C.*`). Paleta
  "Agua Viva": glacier `#1E83DA`, emerald `#10B981`, navy `#0F2E5E`, alert
  `#F59E0B`, critical `#F43F6E`, accent lima `#84CC16`. **Nunca hardcodear hex.**
- **Marca:** logo = molinete de 8 gotas (`src/components/Logo.tsx`, prop
  `solid` para blanco, `animated`). Favicon en `src/app/icon.svg`.
- **Seguridad (Fase 0 hecha):** zod en todas las rutas POST
  (`src/lib/validation/schemas.ts`), rate-limit in-memory
  (`src/lib/security/rateLimit.ts`), headers en `next.config.js`,
  CI en `.github/workflows/ci.yml`, tests en `tests/`.

## Qué YA está hecho
- **Cimientos Fase 0:** repository factory con contexto, RLS por org en el
  schema, zod, rate-limit, headers, CI (typecheck+test+build), Vitest.
- **Marca/visual:** paleta nueva, logo molinete animado, hero **monocromo**
  (blanco, sin acentos de color en el texto; foto aérea de riego comprimida),
  imagen OG dedicada (`public/og.jpg`).
- **Landing completa:** hero + simulador interactivo + 4 pilares + **3 pasos**
  + banda emocional + por qué + datos + planes (lee `tiers.ts`) + cierre +
  **footer con legales**. Páginas `/precios`, `/privacidad`, `/terminos`. 404
  de marca (`src/app/not-found.tsx`). Microinteracción: la curva del hero se
  dibuja.
- **Dashboard (vistas en `src/components/views/`):**
  - **Mi rancho (FincaView):** héroe "decisión de hoy" + ahorro operativo
    (coherente, separado del valor de cosecha) + detalle colapsable (Simple
    vs Técnico). KPIs clicables.
  - **Costos:** rubros editables, productividad del agua, **huella hídrica y
    de carbono (m³/ton, kgCO₂e/ton)**, historial.
  - **Bitácora de riego (RiegoView):** registra por **horas de bombeo o m³**,
    pozo, estima **energía + derechos de agua**, **control de concesión**
    (REPDA, % usado, proyección con alerta), **medidor volumétrico** (delta
    entre lecturas), y **Reporte CONAGUA** imprimible (`/reporte-conagua`).
  - **Futuro del agua:** layout 2 columnas (palancas izq + gráfica der sticky),
    palancas incl. **tecnificación de riego**, escenarios preset.
  - **Mis pozos:** salud de bombas, edición, captura de lecturas, alerta
    WhatsApp (preview).
  - **Estudio (IA), Mapa, Ajustes, Ayuda.**
- **Asistente** (`src/components/Agent.tsx` + `src/lib/brain/localAgent.ts`):
  chat que sin API key responde por reglas (riego, pozos, costos, ahorro,
  futuro, venta, huella, clima, saludos) con los números reales.
- **Experiencia de demo:** modal de **Bienvenida** (`WelcomeModal`),
  **"Reiniciar demo"** (`src/lib/demo.ts`, borra localStorage), rancho llamado
  **"Rancho de ejemplo"**. Móvil: drawer, KPIs en carrusel, safe-area iPhone.

## Cómo se trabaja (normas)
- **Rama:** se trabaja directo en `main` (sin ramas nuevas). Siempre
  `npm run typecheck && npm test && npm run build` ANTES de `git push origin main`.
- **El demo debe funcionar con CERO configuración** (sin claves). No romper eso.
- **UI en español de México:** usar **"rancho"/"campo"**, NUNCA "finca".
- **Honestidad:** los datos son simulados; decirlo donde aplique.
- **Imágenes:** comprimir siempre (sharp; las del hero a ~2560px / <600KB).

## Qué FALTA para un SaaS real (Fase 1+)
1. **Volverlo real:** Supabase Auth + BD (correr `schema.sql`), `@supabase/ssr`
   + `middleware.ts`, resolver `orgId`/`role` desde `memberships` en
   `authContext.ts`, UI de registro/organización. Migrar de localStorage al
   `SupabaseRepository` (ya implementa el contrato; falta scoping por org).
2. **Cobro:** Stripe (o Conekta/Mercado Pago para México) + **gating real de
   planes** (límites de `tiers.ts` aplicados con `hasFeature/withinLimit`).
3. **Calidad transversal:** Sentry (errores), PostHog (analítica), tests E2E
   (Playwright), auditoría a11y + Lighthouse.
4. **Datos reales (alto valor, muy Chihuahua):** 🥇 OpenET (ET satelital),
   tarifa agrícola CFE (9/9N/9CU), NDVI Sentinel-2; 🥈 SMAP, NASA POWER/SMN,
   SNIIM/SIAP; 🥉 INEGI/RAN, FIRA/FND. Sensores IoT vía `/api/ingest`.
5. **Pendientes finos:** reconciliar medidor vs bitácora; QA móvil real en
   dispositivo; borrar 2 ramas viejas del remoto (`git push` no las borra en
   este entorno → hacerlo desde la UI de GitHub).

## Comandos
```
npm run dev        # demo local, sin claves
npm run typecheck  # tipos
npm test           # Vitest
npm run build      # build de producción
```
