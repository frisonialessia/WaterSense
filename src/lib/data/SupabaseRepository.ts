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
  CostEntry,
  WeatherDay,
  ScheduledAction,
  SavingsSummary,
  KpiTrends,
  AquiferNeighborhood,
  WaterConcession,
  RanchConfig,
  Reading,
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

const toConcession = (r: Row): WaterConcession => ({
  id: r.id,
  titular: r.titular,
  uso: r.uso,
  volumeM3Year: Number(r.volume_m3_year),
  distanceKm: Number(r.distance_km ?? 0),
  status: r.status,
  levelTrendMPerYear: r.level_trend_m_per_year != null ? Number(r.level_trend_m_per_year) : undefined,
});

const toCostEntry = (r: Row): CostEntry => ({
  id: r.id,
  category: r.category,
  amount: Number(r.amount),
  date: r.spent_on,
  recurring: Boolean(r.recurring),
  period: r.period ?? undefined,
  workers: r.workers ?? undefined,
  workersList: r.workers_list ?? undefined,
  parcelId: r.parcel_id ?? undefined,
  quantity: r.quantity != null ? Number(r.quantity) : undefined,
  unit: r.unit ?? undefined,
  note: r.note ?? undefined,
  fileName: r.file_url ?? undefined,
});

const toRanch = (r: Row): RanchConfig => ({
  id: r.id,
  name: r.name,
  owner: r.owner ?? "",
  regionId: r.region_id,
  lat: Number(r.lat),
  lng: Number(r.lng),
  altitudeM: Number(r.altitude_m),
  hectares: Number(r.hectares),
  mainCrop: r.main_crop,
  tariffType: r.tariff_type,
  notes: r.notes ?? "",
  concessionM3Year: r.concession_m3_year != null ? Number(r.concession_m3_year) : undefined,
  concessionTitle: r.concession_title ?? undefined,
  contractedKw: r.contracted_kw != null ? Number(r.contracted_kw) : undefined,
  cfeService: r.cfe_service ?? undefined,
  phone: r.phone ?? undefined,
});

const toReading = (r: Row): Reading => ({
  id: r.id,
  source: r.source,
  metric: r.metric,
  value: Number(r.value),
  unit: r.unit ?? undefined,
  recordedAt: r.recorded_at,
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
    const concessions = (data ?? []).map(toConcession);
    return {
      aquiferName: data?.[0]?.aquifer_name ?? "—",
      status: "Sobreexplotado", // TODO: derivar de CONAGUA (disponibilidad DOF)
      decreeYear: 2020,
      totalUsersAprox: concessions.length,
      concessions,
    };
  }

  // ── Wells ──────────────────────────────────────────────
  async addWell(w: Well): Promise<void> {
    const { error } = await this.sb.from("wells").insert({
      id: w.id,
      ranch_id: this.ranchId(),
      name: w.name,
      current_flow_lph: w.currentFlowLph,
      sustainable_flow_lph: w.sustainableFlowLph,
      depth_m: w.depthM,
      rated_starts: w.ratedStarts,
      starts: w.starts,
      ok: w.ok,
      lat: w.lat,
      lng: w.lng,
    });
    if (error) throw error;
  }
  async updateWell(id: string, patch: Partial<Well>): Promise<void> {
    const row: Row = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.currentFlowLph !== undefined) row.current_flow_lph = patch.currentFlowLph;
    if (patch.sustainableFlowLph !== undefined) row.sustainable_flow_lph = patch.sustainableFlowLph;
    if (patch.depthM !== undefined) row.depth_m = patch.depthM;
    if (patch.ratedStarts !== undefined) row.rated_starts = patch.ratedStarts;
    if (patch.starts !== undefined) row.starts = patch.starts;
    if (patch.ok !== undefined) row.ok = patch.ok;
    if (patch.lat !== undefined) row.lat = patch.lat;
    if (patch.lng !== undefined) row.lng = patch.lng;
    const { error } = await this.sb.from("wells").update(row).eq("id", id);
    if (error) throw error;
  }
  async removeWell(id: string): Promise<void> {
    const { error } = await this.sb.from("wells").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Neighbors / concessions ────────────────────────────
  async addConcession(c: WaterConcession): Promise<void> {
    const { error } = await this.sb.from("water_concessions").insert({
      id: c.id,
      ranch_id: this.ranchId(), // user-added neighbor belongs to this ranch
      aquifer_name: "",
      titular: c.titular,
      uso: c.uso,
      volume_m3_year: c.volumeM3Year,
      distance_km: c.distanceKm,
      status: c.status,
      level_trend_m_per_year: c.levelTrendMPerYear,
    });
    if (error) throw error;
  }
  async removeConcession(id: string): Promise<void> {
    const { error } = await this.sb.from("water_concessions").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Cost ledger ────────────────────────────────────────
  async getCostEntries(): Promise<CostEntry[]> {
    const { data, error } = await this.sb.from("cost_entries").select("*").order("spent_on", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toCostEntry);
  }
  async addCostEntry(e: CostEntry): Promise<void> {
    const { error } = await this.sb.from("cost_entries").insert({
      id: e.id,
      ranch_id: this.ranchId(),
      category: e.category,
      amount: e.amount,
      spent_on: e.date,
      recurring: e.recurring,
      period: e.period,
      workers: e.workers,
      workers_list: e.workersList,
      parcel_id: e.parcelId,
      quantity: e.quantity,
      unit: e.unit,
      note: e.note ?? "",
      file_url: e.fileName,
    });
    if (error) throw error;
  }
  async removeCostEntry(id: string): Promise<void> {
    const { error } = await this.sb.from("cost_entries").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Ranch settings ─────────────────────────────────────
  async getRanch(): Promise<RanchConfig | null> {
    const { data, error } = await this.sb.from("ranches").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data ? toRanch(data) : null;
  }
  async saveRanch(r: RanchConfig): Promise<void> {
    const { error } = await this.sb.from("ranches").upsert({
      id: r.id,
      name: r.name,
      owner: r.owner,
      region_id: r.regionId,
      lat: r.lat,
      lng: r.lng,
      altitude_m: r.altitudeM,
      hectares: r.hectares,
      main_crop: r.mainCrop,
      tariff_type: r.tariffType,
      notes: r.notes,
      concession_m3_year: r.concessionM3Year,
      concession_title: r.concessionTitle,
      contracted_kw: r.contractedKw,
      cfe_service: r.cfeService,
      phone: r.phone,
    });
    if (error) throw error;
  }

  // ── Telemetry ──────────────────────────────────────────
  async ingestReading(reading: Reading): Promise<void> {
    const { error } = await this.sb.from("readings").insert({
      ranch_id: this.ranchId(),
      source: reading.source,
      metric: reading.metric,
      value: reading.value,
      unit: reading.unit,
      recorded_at: reading.recordedAt,
    });
    if (error) throw error;
  }
  async getReadings(metric: string, sinceISO?: string): Promise<Reading[]> {
    let q = this.sb.from("readings").select("*").eq("metric", metric).order("recorded_at", { ascending: true });
    if (sinceISO) q = q.gte("recorded_at", sinceISO);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(toReading);
  }

  /** Active ranch id for inserts (set DEMO_RANCH_ID, or wire to auth later). */
  private ranchId(): string | null {
    return process.env.DEMO_RANCH_ID ?? null;
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
