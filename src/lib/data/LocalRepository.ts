// ============================================================
// WaterSense — LocalRepository (sin nube, sin Supabase)
// ------------------------------------------------------------
// Implementa TODO el contrato FarmRepository guardando los datos
// del usuario en localStorage del navegador. No necesita base de
// datos, llaves ni internet.
//
// Reparto:
//   • Datos del usuario (parcelas dibujadas, pozos, vecinos, gastos,
//     ranchos y LECTURAS) → localStorage, persistentes entre recargas.
//   • Catálogos y derivados (cultivos, regiones, tarifa CENACE, clima,
//     acuífero…) → vienen de un "snapshot" sembrado (lo que el server
//     ya calcula). Así el contrato queda completo en el cliente.
//
// Usa las MISMAS llaves que el panel para ser consistente con lo que
// ya se guarda hoy. Para activarlo como repositorio único, ver
// repository.ts.
// ============================================================

import type { FarmRepository } from "./FarmRepository";
import type { Parcel, Well, Region, CropProfile, CropType, CostItem, CostEntry, WeatherDay, ScheduledAction, SavingsSummary, KpiTrends, AquiferNeighborhood, WaterConcession, RanchConfig, Reading } from "@/types/domain";

/** Catálogos + derivados que el cliente no calcula (los siembra el server). */
export interface LocalSeed {
  parcels?: Parcel[];
  wells?: Well[];
  regions?: Region[];
  crops?: CropProfile[];
  costs?: CostItem[];
  tariffCurve?: number[];
  forecast?: WeatherDay[];
  actions?: ScheduledAction[];
  savings?: SavingsSummary;
  trends?: KpiTrends;
  aquifer?: AquiferNeighborhood;
}

const K = {
  userParcels: "watersense.userParcels",
  wells: "watersense.wells",
  concessions: "watersense.concessions",
  costEntries: "watersense.costEntries",
  ranches: "watersense.ranches",
  readings: "watersense.readings",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* cuota llena / modo privado: ignoramos */
  }
}

export class LocalRepository implements FarmRepository {
  constructor(private seed: LocalSeed = {}) {}

  // ── Catálogos / derivados (del snapshot del server) ────
  async getRegions() {
    return this.seed.regions ?? [];
  }
  async getCrops() {
    return this.seed.crops ?? [];
  }
  async getCropProfile(crop: CropType) {
    return (this.seed.crops ?? []).find((c) => c.crop === crop) ?? null;
  }
  async getCosts() {
    return this.seed.costs ?? [];
  }
  async getTariffCurve() {
    return this.seed.tariffCurve ?? [];
  }
  async getForecast() {
    return this.seed.forecast ?? [];
  }
  async getScheduledActions() {
    return this.seed.actions ?? [];
  }
  async getSavings() {
    return this.seed.savings ?? { amountThisMonth: 0, vsLastMonthPct: 0 };
  }
  async getKpiTrends() {
    return this.seed.trends ?? { spend: [], healthy: [], pumps: [], alerts: [] };
  }

  // ── Parcelas (siembra + las que dibuja el usuario) ─────
  async getParcels(): Promise<Parcel[]> {
    return [...(this.seed.parcels ?? []), ...read<Parcel[]>(K.userParcels, [])];
  }
  async addParcel(parcel: Parcel) {
    write(K.userParcels, [...read<Parcel[]>(K.userParcels, []), parcel]);
  }
  async removeParcel(id: string) {
    write(K.userParcels, read<Parcel[]>(K.userParcels, []).filter((p) => p.id !== id));
  }

  // ── Pozos ──────────────────────────────────────────────
  async getWells(): Promise<Well[]> {
    return read<Well[]>(K.wells, this.seed.wells ?? []);
  }
  async addWell(well: Well) {
    write(K.wells, [...(await this.getWells()), well]);
  }
  async updateWell(id: string, patch: Partial<Well>) {
    write(K.wells, (await this.getWells()).map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  async removeWell(id: string) {
    write(K.wells, (await this.getWells()).filter((w) => w.id !== id));
  }

  // ── Vecinos / concesiones ──────────────────────────────
  private concessions(): WaterConcession[] {
    return read<WaterConcession[]>(K.concessions, this.seed.aquifer?.concessions ?? []);
  }
  async getAquiferNeighborhood(): Promise<AquiferNeighborhood> {
    const base = this.seed.aquifer ?? { aquiferName: "—", status: "Sobreexplotado", decreeYear: 2020, totalUsersAprox: 0, concessions: [] };
    return { ...base, concessions: this.concessions() };
  }
  async addConcession(c: WaterConcession) {
    write(K.concessions, [...this.concessions(), c]);
  }
  async removeConcession(id: string) {
    write(K.concessions, this.concessions().filter((c) => c.id !== id));
  }

  // ── Libro de gastos ────────────────────────────────────
  async getCostEntries(): Promise<CostEntry[]> {
    return read<CostEntry[]>(K.costEntries, []);
  }
  async addCostEntry(entry: CostEntry) {
    write(K.costEntries, [entry, ...(await this.getCostEntries())]);
  }
  async removeCostEntry(id: string) {
    write(K.costEntries, (await this.getCostEntries()).filter((e) => e.id !== id));
  }

  // ── Ranchos ────────────────────────────────────────────
  async getRanch(): Promise<RanchConfig | null> {
    return read<RanchConfig[]>(K.ranches, [])[0] ?? null;
  }
  async saveRanch(ranch: RanchConfig) {
    const list = read<RanchConfig[]>(K.ranches, []);
    const i = list.findIndex((r) => r.id === ranch.id);
    if (i >= 0) list[i] = ranch;
    else list.push(ranch);
    write(K.ranches, list);
  }

  // ── Telemetría (sensores / captura manual) ─────────────
  async ingestReading(reading: Reading) {
    const list = read<Reading[]>(K.readings, []);
    write(K.readings, [...list, { ...reading, id: list.length + 1 }]);
  }
  async getReadings(metric: string, sinceISO?: string): Promise<Reading[]> {
    return read<Reading[]>(K.readings, [])
      .filter((r) => r.metric === metric && (!sinceISO || r.recordedAt >= sinceISO))
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }
}
