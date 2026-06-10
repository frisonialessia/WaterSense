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

## Roadmap (qué sigue)

- **Fase 1 · Prototipo — hoy ✅**
  Panel completo, clima real (Open-Meteo) y precio de luz (CENACE) en vivo,
  edición y persistencia local (sin nube), multi-rancho, PWA offline. Listo para demo.
- **Fase 2 · Multi-usuario y nube**
  Auth (Supabase Auth u OTP por WhatsApp), `ranch_id` por usuario con RLS, y
  escritura real vía `SupabaseRepository` — el contrato (`FarmRepository`) y el
  `supabase/schema.sql` ya están completos. Sincronización entre dispositivos.
- **Fase 3 · Datos reales y telemetría**
  Ingesta a la tabla `readings` (sensores de nivel/caudal/presión/kWh por
  LoRaWAN o celular, o la captura manual que ya existe), cruce geoespacial
  (PostGIS) para "vecinos a X km", y calibración del modelo del acuífero con
  piezometría real de CONAGUA.
- **Fase 4 · Inteligencia y automatización**
  Agente con Claude sobre datos reales, alertas por WhatsApp (Twilio, endpoint
  `/api/notify` listo), programación automática del riego en la ventana barata,
  recomendación de cultivo según agua disponible, y reportes de huella
  (m³/ton, kgCO₂e/ton) para financiamiento y compradores.

## Alcances (hasta dónde puede crecer)

- **De un rancho a muchos** (multi-rancho ya está en la UI) y de ahí a una
  **región o distrito de riego**, agregando acuíferos y módulos.
- **Cumplimiento hídrico:** índice de uso de concesión (extraído vs.
  concesionado en REPDA) y trazabilidad para CONAGUA.
- **Optimización de energía:** bombeo y demanda contratada (CFE/CENACE).
- **Decisión de mercado:** ventana óptima de venta por cultivo.
- **Replicable** a cualquier región agrícola de México: solo se cambian región,
  acuífero, cultivos y tarifas en los catálogos.
- **Métricas que habilita** (algunas ya en la app): `$/m³`, `kg/m³` (productividad
  del agua), `kWh/m³` (eficiencia de bombeo), abatimiento m/año, margen por ha y
  por cultivo, y costos por rubro (luz, agua, nómina, fertilizante, agroquímicos,
  maquinaria, cosecha, fletes, renta, crédito…).

## APIs y fuentes que se pueden conectar

Cada fuente alimenta una vista concreta del dashboard. Por eso la lista no es
una "wishlist": cada integración tiene un lugar y un para qué.

| Fuente | Qué aporta | Alimenta (vista) | Estado |
|---|---|---|---|
| **Open-Meteo** | Pronóstico, temperatura, lluvia | Mi rancho · clima | ✅ conectado |
| **CENACE** (PML) | Precio de luz por hora ($/kWh) | Costos · Bitácora de riego | ✅ en vivo (`/api/tariff`) |
| **Anthropic (Claude)** | Asistente y estudio de riego con IA | Asistente · Estudio | ✅ opcional |
| **MapLibre + teselas** (MapTiler/Mapbox) | Mapa y capas del campo | Mapa del campo | ✅ |
| **Supabase / Postgres** | Persistencia multi-usuario + auth | Todo el dashboard | 🔌 `schema.sql` listo |
| **CONAGUA · REPDA** | Concesiones y vecinos del acuífero | Mis pozos · Futuro del agua | 🔌 estructura lista |
| **CONAGUA · Disponibilidad (DOF)** | Recarga vs. extracción del acuífero | Futuro del agua | 🔌 `aquiferModel` |
| **CONAGUA · red piezométrica** | Niveles freáticos / abatimiento real | Futuro del agua · Pozos | 🔌 tabla `readings` |
| **CFE** (servicio/RPU, carga kW) | Desglose del recibo eléctrico | Costos · Ajustes | 🔌 campos en Ajustes |
| **SIAP / precios de mercado** | $/kg por cultivo, "¿cuándo vender?" | Mi rancho · mercado | 🔌 `marketModel` |
| **Twilio** (WhatsApp/SMS) | Envío real de alertas | Mis pozos · alertas | 🔌 `/api/notify` |
| **Sensores IoT** (LoRaWAN/MQTT) | Nivel, caudal, presión, kWh, humedad | Pozos · Bitácora · Futuro | 🔌 `/api/ingest` |
| 🥇 **OpenET** (evapotranspiración satelital) | Cuánta agua *necesitó/usó* el cultivo | Mi rancho · Bitácora · Futuro | 🆕 por conectar |
| 🥇 **Tarifas agrícolas CFE** (9/9N/9CU) | Tarifa de estímulo agrícola real | Costos · Bitácora de riego | 🆕 por conectar |
| 🥇 **Sentinel-2 / Landsat** (NDVI) | Vigor y estrés del cultivo (sin sensores) | Mapa del campo · Mi rancho | 🆕 por conectar |
| 🥈 **SMAP** (humedad de suelo satelital) | Humedad del suelo por zona | Mapa del campo · Mi rancho | 🆕 por conectar |
| 🥈 **NASA POWER / SMN** | ET0, radiación, clima oficial (respaldo) | Mi rancho · clima | 🆕 por conectar |
| 🥈 **SNIIM** (precios mayoristas MX) | Precio real por cultivo | Mi rancho · mercado | 🆕 por conectar |
| 🥉 **INEGI / RAN** (catastro, uso de suelo) | Límites de parcela y padrón | Mapa del campo | 🆕 por conectar |
| 🥉 **Conekta / Mercado Pago** | Cobro local mexicano | Planes / billing | 🆕 por conectar |
| 🥉 **FIRA / FND** | Financiamiento + huella hídrica para crédito | Estudio · Costos | 🆕 por conectar |

> ✅ = conectado · 🔌 = contrato/estructura ya en el código, falta la credencial ·
> 🆕 = recomendada, por diseñar el enchufe. 🥇🥈🥉 = prioridad sugerida.
> Todas las variables viven en `.env.example` y son **opcionales**.

### Roadmap de integraciones (por prioridad de valor)

- **🥇 Oro — convierten el demo en herramienta imprescindible.** Le dicen al
  agrónomo, con datos reales y **sin hardware**, cuánta agua necesita el cultivo
  y cuánto cuesta sacarla: **OpenET** (ET satelital), **tarifa agrícola CFE**
  (costo de bombeo exacto) y **NDVI Sentinel** (vigor/estrés del cultivo).
- **🥈 Plata — precisión y confianza.** Humedad de suelo (**SMAP**), clima oficial
  (**NASA POWER / SMN**) y precios reales de mercado (**SNIIM/SIAP**).
- **🥉 Bronce — operación y negocio.** Catastro (**INEGI/RAN**), cobro local
  (**Conekta / Mercado Pago**) y financiamiento (**FIRA / FND**).
- **Telemetría (transversal).** Los **sensores IoT** vía `/api/ingest` son el
  salto de "simulado" a "real" y alimentan Pozos, Bitácora y Futuro del agua.

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
