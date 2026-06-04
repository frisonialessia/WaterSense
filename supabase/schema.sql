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

create table if not exists cost_items (
  id        uuid primary key default uuid_generate_v4(),
  ranch_id  uuid references ranches (id) on delete cascade,
  label     text not null,
  icon      text not null,
  month     numeric not null,
  trend     numeric not null default 0,
  note      text default ''
);

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
  status          text not null default 'vigente'
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
