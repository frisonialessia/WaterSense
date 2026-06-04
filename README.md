# WaterSense

Auditor de eficiencia de riego para agricultura de alto rendimiento (Chihuahua).
Next.js 14 + TypeScript. El "cerebro" corre en el servidor con datos simulados,
tipado para conectar datos reales (Supabase, CONAGUA, clima) sin reescribir la lógica.

---

## Qué hay aquí

```
src/
  types/domain.ts            ← contrato de datos (la única fuente de verdad)
  lib/brain/
    decisionEngine.ts        ← regar ahora vs esperar (tarifa vs estrés)
    aquiferModel.ts          ← proyección del acuífero / año límite
    pumpHealth.ts            ← mantenimiento predictivo de pozos
    localAgent.ts            ← asistente por reglas (funciona sin claves)
  lib/data/
    FarmRepository.ts        ← interfaz (el contrato del repositorio)
    SimulatedRepository.ts   ← datos simulados de Chihuahua (hoy)
    repository.ts            ← ★ EL punto único de intercambio (1 línea)
  lib/theme.ts               ← marca: paleta, temas, tokens de diseño
  components/                ← UI del dashboard (shell, vistas, mapa, agente)
  app/
    page.tsx                 ← landing pública
    dashboard/page.tsx       ← dashboard (ejecuta el cerebro server-side)
    api/decision/route.ts    ← POST motor de decisión
    api/aquifer/route.ts     ← POST proyección acuífero
    api/agent/route.ts       ← POST asistente (local sin clave · Claude con clave)
supabase/schema.sql          ← esquema listo para cuando conectes la BD
```

**La idea clave:** el cerebro, las rutas API y la UI dependen solo de
`FarmRepository`. Hoy usa `SimulatedRepository`. El día que conectes Supabase,
creas un `SupabaseRepository` que implementa la misma interfaz y cambias **una
sola línea** en `src/lib/data/repository.ts`. Nada más cambia.

**Funciona sin nada configurado:** sin claves ni base de datos, la app muestra
el producto completo con datos simulados y el asistente responde con reglas
locales. Las APIs/BD reales solo "encienden" capacidades, no son requisito.

---

## Correr en tu computadora

Necesitas **Node.js 18+** instalado.

```bash
npm install
npm run dev          # no necesitas ninguna clave para verlo funcionar
```

Abre http://localhost:3000 — landing pública; entra a `/dashboard` para el
producto: mapa, costos, futuro del acuífero, pozos y el asistente.

¿Quieres que el asistente use Claude en vez de reglas locales? (opcional)

```bash
cp .env.example .env.local   # y rellena ANTHROPIC_API_KEY
```

---

## Subir a GitHub

1. Crea una cuenta en https://github.com (gratis).
2. Crea un repositorio nuevo, vacío, llamado `watersense`.
3. En la carpeta del proyecto:

```bash
git init
git add .
git commit -m "WaterSense: esqueleto Next.js + cerebro"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/watersense.git
git push -u origin main
```

---

## Desplegar en Vercel

1. Crea una cuenta en https://vercel.com (gratis) con tu GitHub.
2. "Add New Project" → importa el repo `watersense`.
3. Vercel detecta Next.js solo. **No necesitas configurar nada** para que
   despliegue y funcione (todo simulado). Si quieres el asistente con Claude,
   en **Environment Variables** añade `ANTHROPIC_API_KEY` (opcional).
4. "Deploy". En ~1 minuto tienes una URL pública.

Cada `git push` a `main` vuelve a desplegar automáticamente.

---

## Conectar Supabase (el siguiente paso, cuando estés listo)

1. Crea proyecto en https://supabase.com (gratis).
2. SQL Editor → pega y corre `supabase/schema.sql`.
3. Project Settings → API → copia la URL y las claves a tu `.env.local`
   y a las Environment Variables de Vercel.
4. `npm install @supabase/supabase-js`.
5. Crea `src/lib/data/SupabaseRepository.ts` implementando `FarmRepository`
   (las mismas funciones, leyendo de las tablas).
6. En `src/lib/data/repository.ts`, cambia **una línea**:
   `export const repository: FarmRepository = new SupabaseRepository();`

Nada del cerebro, las rutas API ni la UI cambia. Ese es el punto de toda la
arquitectura.

---

## Conectar APIs / datos reales (para quien tome el código)

Este PoC está hecho para que cualquiera meta sus propias fuentes sin reescribir
nada. Los "enchufes" son:

- **Tu base de datos:** implementa `FarmRepository` (ver sección anterior). Toda
  la app lee de ahí.
- **Tu modelo de IA:** la ruta `api/agent` usa Claude si existe `ANTHROPIC_API_KEY`,
  y si no, el cerebro local (`lib/brain/localAgent.ts`). Cambia el proveedor ahí.
- **Fuentes externas (energía, clima, acuífero, derechos):** cada una llena la
  capa de datos que consume el repositorio. Variables previstas en `.env.example`.

Todas las variables de entorno son **opcionales** y están documentadas en
`.env.example`. Sin ninguna, la demo funciona completa.

---

## Resumen honesto

- **Cuentas necesarias para la demo:** ninguna. Para extender: GitHub y Vercel
  (gratis); Supabase y Anthropic solo si quieres BD real o el agente con Claude.
- **Datos reales** (el verdadero salto de valor): precio de energía (CENACE),
  piezometría del acuífero (CONAGUA), clima (API meteorológica), y sensores de
  humedad/caudal/presión. Cada uno entra como una fuente que alimenta el
  repositorio — el cerebro ya está listo para consumirlos.
- **Lo simulado hoy:** todos los números de `SimulatedRepository` son realistas
  para Chihuahua pero inventados. Sirven para construir y demostrar; no para que
  un agricultor tome una decisión de dinero hasta que entren datos reales.
