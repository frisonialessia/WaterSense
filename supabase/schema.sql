-- ============================================================
-- WaterSense — Esquema de base de datos (Supabase / Postgres)
-- ------------------------------------------------------------
-- Plantilla LISTA PARA CONECTAR. No está activa en el PoC.
-- Para usarla:
--   1) Crea un proyecto en https://supabase.com
--   2) SQL Editor → pega y corre este archivo
--   3) Copia URL y claves a .env.local (ver .env.example)
--   4) Cambia 1 línea en src/lib/data/repository.ts
--      → export const repository = new SupabaseRepository();
-- Las tablas mapean 1:1 con los tipos de src/types/domain.ts.
-- ============================================================

-- Extensiones útiles
create extension if not exists "uuid-ossp";

-- ---------- Catálogos (globales) ----------

create table if not exists crops (
  crop          text primary key,            -- CropType (ej. "Nogal pecanero")
  lamina_m      numeric not null,
  water_m3_ha   numeric not null,
  cost_ha       numeric not null,
  freq_days     integer not null,
  yield_kg_ha   numeric not null,
  price_per_kg  numeric not null
);

create table if not exists regions (
  id           text primary key,
  name         text not null,
  postal_code  text,
  lat          numeric not null,
  lng          numeric not null,
  altitude_m   numeric not null,
  et0          numeric not null
);

-- ---------- Datos por usuario / rancho ----------

create table if not exists ranches (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users (id) on delete cascade,
  name        text not null default 'Mi rancho',
  owner       text default '',
  region_id   text references regions (id),
  lat         numeric not null,
  lng         numeric not null,
  altitude_m  numeric not null default 1170,
  hectares    numeric not null default 0,
  main_crop   text references crops (crop),
  tariff_type text not null default 'Nocturna (CFE)',
  notes       text default '',
  -- Campos que el usuario llena en Ajustes (alimentan energía y cumplimiento):
  concession_m3_year numeric,         -- volumen concesionado CONAGUA (m³/año)
  concession_title   text,            -- núm. de título REPDA
  contracted_kw      numeric,         -- carga contratada CFE (kW)
  cfe_service        text,            -- número de servicio / RPU
  phone              text,            -- teléfono / WhatsApp para alertas
  created_at  timestamptz not null default now()
);

create table if not exists wells (
  id                     uuid primary key default uuid_generate_v4(),
  ranch_id               uuid references ranches (id) on delete cascade,
  name                   text not null,
  current_flow_lph       numeric not null,
  sustainable_flow_lph   numeric not null,
  depth_m                numeric not null,
  rated_starts           integer not null,
  starts                 integer not null,
  ok                     boolean not null default true,
  lat                    numeric,
  lng                    numeric
);

create table if not exists parcels (
  id                uuid primary key default uuid_generate_v4(),
  ranch_id          uuid references ranches (id) on delete cascade,
  name              text not null,
  crop              text references crops (crop),
  hectares          numeric not null,
  stress            numeric not null default 0,   -- 0..1
  lat               numeric,
  lng               numeric,
  boundary          jsonb,                          -- [[lng,lat], ...]
  irrigation_system text,                           -- Goteo | Aspersión | Gravedad
  soil_type         text,                           -- Arenoso | Franco | Arcilloso
  planting_date     date,
  well_id           uuid references wells (id) on delete set null
);

-- Resumen mensual por rubro (lo que ve el panel de un vistazo).
create table if not exists cost_items (
  id        uuid primary key default uuid_generate_v4(),
  ranch_id  uuid references ranches (id) on delete cascade,
  label     text not null,
  icon      text not null,
  month     numeric not null,
  trend     numeric not null default 0,
  note      text default ''
);

-- Libro de gastos: cada movimiento que registra el usuario. Permite derivar
-- $/m³, $/kWh, $/ha y la proyección — etiquetable por parcela y por consumo.
create table if not exists cost_entries (
  id            uuid primary key default uuid_generate_v4(),
  ranch_id      uuid references ranches (id) on delete cascade,
  category      text not null,          -- luz | agua | diesel | mano | fert | agroq | ...
  amount        numeric not null,       -- monto en MXN
  spent_on      date not null,
  recurring     boolean not null default false,
  period        text,                   -- semanal | quincenal | mensual (nómina)
  workers       integer,                -- nómina: # de jornaleros
  workers_list  jsonb,                  -- nómina desglosada [{name, amount}]
  parcel_id     uuid references parcels (id) on delete set null,  -- a qué parcela
  quantity      numeric,                -- consumo ligado (m³ de agua, kWh de luz, L de diésel)
  unit          text,                   -- 'm³' | 'kWh' | 'L'
  note          text default '',
  file_url      text,                   -- comprobante (Storage)
  created_at    timestamptz not null default now()
);
create index if not exists cost_entries_ranch_idx on cost_entries (ranch_id, spent_on);

-- ---------- Fase 4: lecturas de fuentes reales ----------
-- Energía (CENACE), clima (Open-Meteo/CONAGUA), acuífero (CONAGUA piezometría),
-- sensores de suelo/caudal/presión. Todo cae aquí como serie temporal.
create table if not exists readings (
  id         bigint generated always as identity primary key,
  ranch_id   uuid references ranches (id) on delete cascade,
  source     text not null,        -- 'cenace' | 'weather' | 'conagua' | 'sensor' ...
  metric     text not null,        -- 'price_kwh' | 'rain_mm' | 'water_table_m' ...
  value      numeric not null,
  unit       text,
  recorded_at timestamptz not null default now()
);
create index if not exists readings_ranch_metric_idx on readings (ranch_id, metric, recorded_at);

-- ---------- Concesiones del acuífero (REPDA / CONAGUA) ----------
create table if not exists water_concessions (
  id              uuid primary key default uuid_generate_v4(),
  aquifer_name    text not null,
  titular         text not null,
  uso             text not null,         -- Agrícola | Público urbano | Industrial | Pecuario
  volume_m3_year  numeric not null,
  lat             numeric,
  lng             numeric,
  status          text not null default 'vigente',
  -- ranch_id no nulo = vecino que el propio usuario agregó; nulo = dato REPDA global
  ranch_id              uuid references ranches (id) on delete cascade,
  distance_km           numeric,
  level_trend_m_per_year numeric          -- abatimiento observado (negativo = baja)
);

-- ============================================================
-- Row Level Security (cada usuario ve solo sus ranchos)
-- ============================================================
alter table ranches    enable row level security;
alter table wells      enable row level security;
alter table parcels    enable row level security;
alter table cost_items enable row level security;
alter table readings   enable row level security;

-- Catálogos globales: lectura pública
alter table crops   enable row level security;
alter table regions enable row level security;
create policy "crops readable"   on crops   for select using (true);
create policy "regions readable" on regions for select using (true);

-- Ranchos: dueño = auth.uid()
create policy "own ranches" on ranches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Hijos del rancho: a través de ranch_id
create policy "own wells" on wells
  for all using (ranch_id in (select id from ranches where user_id = auth.uid()))
  with check (ranch_id in (select id from ranches where user_id = auth.uid()));
create policy "own parcels" on parcels
  for all using (ranch_id in (select id from ranches where user_id = auth.uid()))
  with check (ranch_id in (select id from ranches where user_id = auth.uid()));
create policy "own cost_items" on cost_items
  for all using (ranch_id in (select id from ranches where user_id = auth.uid()))
  with check (ranch_id in (select id from ranches where user_id = auth.uid()));
create policy "own readings" on readings
  for all using (ranch_id in (select id from ranches where user_id = auth.uid()))
  with check (ranch_id in (select id from ranches where user_id = auth.uid()));

alter table cost_entries enable row level security;
create policy "own cost_entries" on cost_entries
  for all using (ranch_id in (select id from ranches where user_id = auth.uid()))
  with check (ranch_id in (select id from ranches where user_id = auth.uid()));

-- Concesiones: las globales (REPDA, ranch_id nulo) son de lectura pública; las
-- que el usuario agrega (vecinos) solo las maneja su dueño.
alter table water_concessions enable row level security;
create policy "concessions readable" on water_concessions
  for select using (ranch_id is null or ranch_id in (select id from ranches where user_id = auth.uid()));
create policy "own concessions write" on water_concessions
  for all using (ranch_id in (select id from ranches where user_id = auth.uid()))
  with check (ranch_id in (select id from ranches where user_id = auth.uid()));

-- ============================================================
-- Vistas de apoyo para métricas (gasto mensual y por parcela)
-- ============================================================
create or replace view monthly_spend as
  select ranch_id,
         date_trunc('month', spent_on)::date as month,
         sum(amount)                          as total,
         sum(amount) filter (where unit = 'm³')  as water_m3,
         sum(amount) filter (where unit = 'kWh') as energy_kwh
  from cost_entries
  group by ranch_id, date_trunc('month', spent_on);
