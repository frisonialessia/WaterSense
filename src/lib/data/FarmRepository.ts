// ============================================================
// WaterSense — Data repository (the swap seam)
// The brain and API routes depend ONLY on this interface.
// Today it returns simulated data; the day Supabase is ready,
// the SupabaseRepository implements the same interface and
// nothing else changes.
//
// READS feed the panel; WRITES are every mutation the app already
// performs today (drawn parcels, edited wells, added neighbors,
// registered costs, ranch settings) plus telemetry ingestion. This
// is the exact contract a real backend must satisfy.
// ============================================================

import type { Parcel, Well, Region, CropProfile, CropType, CostItem, CostEntry, WeatherDay, ScheduledAction, SavingsSummary, KpiTrends, AquiferNeighborhood, WaterConcession, RanchConfig, Reading } from "@/types/domain";

export interface FarmRepository {
  // ── Reads ──────────────────────────────────────────────
  getParcels(): Promise<Parcel[]>;
  getWells(): Promise<Well[]>;
  getRegions(): Promise<Region[]>;
  getCropProfile(crop: CropType): Promise<CropProfile | null>;
  getCrops(): Promise<CropProfile[]>;
  getCosts(): Promise<CostItem[]>;
  /** 24 hourly electricity prices ($/kWh), index 0..23. */
  getTariffCurve(): Promise<number[]>;
  getForecast(): Promise<WeatherDay[]>;
  getScheduledActions(): Promise<ScheduledAction[]>;
  getSavings(): Promise<SavingsSummary>;
  getKpiTrends(): Promise<KpiTrends>;
  /** Aquifer the farm shares + nearby concessions (REPDA-style). */
  getAquiferNeighborhood(): Promise<AquiferNeighborhood>;

  // ── Parcels (drawn by the farmer) ──────────────────────
  addParcel(parcel: Parcel): Promise<void>;
  removeParcel(id: string): Promise<void>;

  // ── Wells (rename / add / remove / edit) ───────────────
  addWell(well: Well): Promise<void>;
  updateWell(id: string, patch: Partial<Well>): Promise<void>;
  removeWell(id: string): Promise<void>;

  // ── Neighbors sharing the aquifer ──────────────────────
  addConcession(c: WaterConcession): Promise<void>;
  removeConcession(id: string): Promise<void>;

  // ── Cost ledger ────────────────────────────────────────
  getCostEntries(): Promise<CostEntry[]>;
  addCostEntry(entry: CostEntry): Promise<void>;
  removeCostEntry(id: string): Promise<void>;

  // ── Ranch settings ─────────────────────────────────────
  getRanch(): Promise<RanchConfig | null>;
  saveRanch(ranch: RanchConfig): Promise<void>;

  // ── Telemetry (sensors, CENACE, weather, CONAGUA, manual) ─
  ingestReading(reading: Reading): Promise<void>;
  getReadings(metric: string, sinceISO?: string): Promise<Reading[]>;
}
