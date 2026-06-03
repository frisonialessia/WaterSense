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
  lib/data/
    FarmRepository.ts        ← interfaz (el punto de cambio a Supabase)
    SimulatedRepository.ts   ← datos simulados de Chihuahua (hoy)
  app/
    page.tsx                 ← ejecuta el cerebro y muestra el resultado
    api/decision/route.ts    ← POST motor de decisión
    api/aquifer/route.ts     ← POST proyección acuífero
    api/agent/route.ts       ← POST asistente IA (clave secreta en servidor)
supabase/schema.sql          ← esquema listo para cuando conectes la BD
```

**La idea clave:** el cerebro y las rutas API dependen solo de `FarmRepository`.
Hoy usa `SimulatedRepository`. El día que conectes Supabase, creas un
`SupabaseRepository` que implementa la misma interfaz y no cambias nada más.

---

## Correr en tu computadora

Necesitas **Node.js 18+** instalado.

```bash
npm install
cp .env.example .env.local   # rellena ANTHROPIC_API_KEY si quieres el agente
npm run dev
```

Abre http://localhost:3000 — verás el cerebro corriendo (proyección del
acuífero, salud de pozos, parcelas).

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
3. Vercel detecta Next.js solo. En **Environment Variables** añade:
   - `ANTHROPIC_API_KEY` = tu clave de Anthropic.
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
6. En `SimulatedRepository.ts`, cambia la última línea:
   `export const repository = new SupabaseRepository();`

Nada del cerebro cambia. Ese es el punto de toda la arquitectura.

---

## Qué necesitas además (resumen honesto)

- **Cuentas:** GitHub, Vercel, Supabase, Anthropic. Todas con plan gratis para empezar.
- **Datos reales** (el verdadero salto de valor): precio de energía (CENACE),
  piezometría del acuífero (CONAGUA), clima (API meteorológica), y sensores de
  humedad/caudal/presión. Cada uno entra como una fuente que llena la tabla
  `readings` — el cerebro ya está listo para consumirlos.
- **Lo simulado hoy:** todos los números de `SimulatedRepository` son realistas
  para Chihuahua pero inventados. Sirven para construir y demostrar; no para que
  un agricultor tome una decisión de dinero hasta que entren datos reales.
