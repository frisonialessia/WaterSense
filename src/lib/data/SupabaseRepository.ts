// ============================================================
// WaterSense — SupabaseRepository (PLANTILLA, no activa)
// ------------------------------------------------------------
// Implementa la MISMA interfaz FarmRepository que el repositorio
// simulado. No se usa en el PoC. Para activarla:
//   1) Corre supabase/schema.sql en tu proyecto Supabase
//   2) Rellena las variables en .env.local (ver .env.example)
//   3) En src/lib/data/repository.ts cambia 1 línea:
//        export const repository = new SupabaseRepository();
// Nada del cerebro, las rutas API ni la UI cambia.
//
// Nota: las tablas mapean 1:1 con src/types/domain.ts. Los datos
// "externos" (tarifa CENACE, clima, etc.) no viven en la BD: se
// obtienen en rutas API (como /api con Open-Meteo) y, si quieres
// histórico, se guardan en la tabla `readings`.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FarmRepository } from "./FarmRepository";
import type {
  Parcel,
  Well,
  Region,
  CropProfile,
  CropType,
  CostItem,
  WeatherDay,
  ScheduledAction,
  SavingsSummary,
  KpiTrends,
  AquiferNeighborhood,
  IrrigationSystem,
  SoilType,
} from "@/types/domain";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // En servidor usa la service role; en cliente, la anon key.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y la clave de Supabase. Revisa .env.local.");
  }
  return createClient(url, key);
}

// ---- mapeo fila (snake_case) → dominio (camelCase) ----
const toParcel = (r: Row): Parcel => ({
  id: r.id,
  name: r.name,
  crop: r.crop as CropType,
  hectares: Number(r.hectares),
  stress: Number(r.stress),
  lat: r.lat ?? undefined,
  lng: r.lng ?? undefined,
  boundary: r.boundary ?? undefined,
  irrigationSystem: (r.irrigation_system as IrrigationSystem) ?? undefined,
  soilType: (r.soil_type as SoilType) ?? undefined,
  plantingDate: r.planting_date ?? undefined,
  wellId: r.well_id ?? undefined,
});

const toWell = (r: Row): Well => ({
  id: r.id,
  name: r.name,
  currentFlowLph: Number(r.current_flow_lph),
  sustainableFlowLph: Number(r.sustainable_flow_lph),
  depthM: Number(r.depth_m),
  ratedStarts: Number(r.rated_starts),
  starts: Number(r.starts),
  ok: Boolean(r.ok),
  lat: r.lat ?? undefined,
  lng: r.lng ?? undefined,
});

const toRegion = (r: Row): Region => ({
  id: r.id,
  name: r.name,
  postalCode: r.postal_code,
  lat: Number(r.lat),
  lng: Number(r.lng),
  altitudeM: Number(r.altitude_m),
  et0: Number(r.et0),
});

const toCrop = (r: Row): CropProfile => ({
  crop: r.crop as CropType,
  laminaM: Number(r.lamina_m),
  waterM3ha: Number(r.water_m3_ha),
  costHa: Number(r.cost_ha),
  freqDays: Number(r.freq_days),
  yieldKgHa: Number(r.yield_kg_ha),
  pricePerKg: Number(r.price_per_kg),
});

const toCost = (r: Row): CostItem => ({
  id: r.id,
  label: r.label,
  icon: r.icon,
  month: Number(r.month),
  trend: Number(r.trend),
  note: r.note ?? "",
});

export class SupabaseRepository implements FarmRepository {
  private sb: SupabaseClient;
  constructor(client?: SupabaseClient) {
    this.sb = client ?? makeClient();
  }

  async getParcels(): Promise<Parcel[]> {
    const { data, error } = await this.sb.from("parcels").select("*");
    if (error) throw error;
    return (data ?? []).map(toParcel);
  }

  async getWells(): Promise<Well[]> {
    const { data, error } = await this.sb.from("wells").select("*");
    if (error) throw error;
    return (data ?? []).map(toWell);
  }

  async getRegions(): Promise<Region[]> {
    const { data, error } = await this.sb.from("regions").select("*");
    if (error) throw error;
    return (data ?? []).map(toRegion);
  }

  async getCropProfile(crop: CropType): Promise<CropProfile | null> {
    const { data, error } = await this.sb.from("crops").select("*").eq("crop", crop).maybeSingle();
    if (error) throw error;
    return data ? toCrop(data) : null;
  }

  async getCrops(): Promise<CropProfile[]> {
    const { data, error } = await this.sb.from("crops").select("*");
    if (error) throw error;
    return (data ?? []).map(toCrop);
  }

  async getCosts(): Promise<CostItem[]> {
    const { data, error } = await this.sb.from("cost_items").select("*");
    if (error) throw error;
    return (data ?? []).map(toCost);
  }

  async addParcel(parcel: Parcel): Promise<void> {
    const { error } = await this.sb.from("parcels").insert({
      id: parcel.id,
      name: parcel.name,
      crop: parcel.crop,
      hectares: parcel.hectares,
      stress: parcel.stress,
      lat: parcel.lat,
      lng: parcel.lng,
      boundary: parcel.boundary,
      irrigation_system: parcel.irrigationSystem,
      soil_type: parcel.soilType,
      planting_date: parcel.plantingDate,
      well_id: parcel.wellId,
    });
    if (error) throw error;
  }

  async removeParcel(id: string): Promise<void> {
    const { error } = await this.sb.from("parcels").delete().eq("id", id);
    if (error) throw error;
  }

  async getAquiferNeighborhood(): Promise<AquiferNeighborhood> {
    const { data } = await this.sb.from("water_concessions").select("*");
    const concessions = (data ?? []).map((r: Row, i: number) => ({
      id: r.id ?? `c${i}`,
      titular: r.titular,
      uso: r.uso,
      volumeM3Year: Number(r.volume_m3_year),
      distanceKm: Number(r.distance_km ?? 0),
      status: r.status,
    }));
    return {
      aquiferName: data?.[0]?.aquifer_name ?? "—",
      status: "Sobreexplotado", // TODO: derivar de CONAGUA (disponibilidad DOF)
      decreeYear: 2020,
      totalUsersAprox: concessions.length,
      concessions,
    };
  }

  // ── Datos externos / derivados ──────────────────────────────
  // No viven en la BD: vienen de APIs (CENACE, clima) o se calculan.
  // Reemplaza estos por llamadas a tus rutas API / tabla `readings`.

  async getTariffCurve(): Promise<number[]> {
    // TODO: precio real por hora desde CENACE (o tabla `readings`).
    return Array.from({ length: 24 }, (_, h) =>
      Math.max(0.6, Math.round((1.8 + Math.sin(((h - 15) / 24) * 6.28) * 0.9 + (h >= 18 && h <= 22 ? 0.8 : 0) - (h >= 1 && h <= 5 ? 0.5 : 0)) * 100) / 100)
    );
  }

  async getForecast(): Promise<WeatherDay[]> {
    // TODO: clima real (la app ya consulta Open-Meteo en el cliente).
    return [];
  }

  async getScheduledActions(): Promise<ScheduledAction[]> {
    // TODO: generar desde el motor de decisión sobre datos reales.
    return [];
  }

  async getSavings(): Promise<SavingsSummary> {
    // TODO: calcular contra el patrón histórico del usuario.
    return { amountThisMonth: 0, vsLastMonthPct: 0 };
  }

  async getKpiTrends(): Promise<KpiTrends> {
    // TODO: series desde la tabla `readings`.
    return { spend: [], healthy: [], pumps: [], alerts: [] };
  }
}
