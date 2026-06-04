// ============================================================
// WaterSense — Simulated repository
// Realistic Chihuahua values. Swap for SupabaseRepository when
// the database is connected — see README "Conectar Supabase".
// ============================================================

import type { FarmRepository } from "./FarmRepository";
import type { Parcel, Well, Region, CropProfile, CropType, CostItem, WeatherDay, ScheduledAction, SavingsSummary, KpiTrends, AquiferNeighborhood } from "@/types/domain";

// Profiles simulados con rangos plausibles para Chihuahua (m, m³/ha, $/ha,
// días, kg/ha, $/kg). Ganadería y "Otro" son aproximaciones de referencia.
const CROPS: Record<CropType, CropProfile> = {
  "Nogal pecanero": { crop: "Nogal pecanero", laminaM: 1.9, waterM3ha: 19000, costHa: 14200, freqDays: 7, yieldKgHa: 3200, pricePerKg: 75 },
  "Alfalfa": { crop: "Alfalfa", laminaM: 1.7, waterM3ha: 17000, costHa: 12800, freqDays: 10, yieldKgHa: 18000, pricePerKg: 4.5 },
  "Chile jalapeño": { crop: "Chile jalapeño", laminaM: 0.8, waterM3ha: 8000, costHa: 6400, freqDays: 4, yieldKgHa: 28000, pricePerKg: 9 },
  "Manzano": { crop: "Manzano", laminaM: 1.1, waterM3ha: 11000, costHa: 8900, freqDays: 8, yieldKgHa: 35000, pricePerKg: 8 },
  "Maíz forrajero": { crop: "Maíz forrajero", laminaM: 1.0, waterM3ha: 10000, costHa: 7600, freqDays: 6, yieldKgHa: 55000, pricePerKg: 2.8 },
  "Algodón": { crop: "Algodón", laminaM: 1.0, waterM3ha: 10000, costHa: 13000, freqDays: 8, yieldKgHa: 4500, pricePerKg: 8 },
  "Sorgo forrajero": { crop: "Sorgo forrajero", laminaM: 0.7, waterM3ha: 7000, costHa: 6000, freqDays: 8, yieldKgHa: 45000, pricePerKg: 2.2 },
  "Avena forrajera": { crop: "Avena forrajera", laminaM: 0.5, waterM3ha: 5000, costHa: 4500, freqDays: 9, yieldKgHa: 30000, pricePerKg: 2.5 },
  "Frijol": { crop: "Frijol", laminaM: 0.5, waterM3ha: 5000, costHa: 7000, freqDays: 7, yieldKgHa: 1800, pricePerKg: 25 },
  "Cebolla": { crop: "Cebolla", laminaM: 0.9, waterM3ha: 9000, costHa: 30000, freqDays: 5, yieldKgHa: 45000, pricePerKg: 7 },
  "Calabaza": { crop: "Calabaza", laminaM: 0.6, waterM3ha: 6000, costHa: 12000, freqDays: 5, yieldKgHa: 25000, pricePerKg: 6 },
  "Sandía": { crop: "Sandía", laminaM: 0.7, waterM3ha: 7000, costHa: 14000, freqDays: 4, yieldKgHa: 40000, pricePerKg: 5 },
  "Papa": { crop: "Papa", laminaM: 0.8, waterM3ha: 8000, costHa: 35000, freqDays: 5, yieldKgHa: 35000, pricePerKg: 9 },
  "Fresa": { crop: "Fresa", laminaM: 1.2, waterM3ha: 12000, costHa: 120000, freqDays: 3, yieldKgHa: 30000, pricePerKg: 45 },
  "Trigo": { crop: "Trigo", laminaM: 0.5, waterM3ha: 5000, costHa: 9000, freqDays: 10, yieldKgHa: 6000, pricePerKg: 6 },
  "Ganadería (pastizal)": { crop: "Ganadería (pastizal)", laminaM: 0.6, waterM3ha: 6000, costHa: 4000, freqDays: 14, yieldKgHa: 600, pricePerKg: 70 },
  "Otro": { crop: "Otro", laminaM: 1.0, waterM3ha: 10000, costHa: 9000, freqDays: 7, yieldKgHa: 10000, pricePerKg: 5 },
};

// Deterministic pseudo-random in [0,1) from a seed, so boundaries are
// stable across renders (no hydration mismatch) yet look irregular.
const rnd = (n: number): number => {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Build a plausible, slightly irregular field outline around a centroid,
 * sized from hectares. Simulated geometry — with Supabase this becomes the
 * polygon the farmer actually drew.
 */
function fieldBoundary(lng: number, lat: number, hectares: number, seed: number): [number, number][] {
  const sideM = Math.sqrt(hectares * 10000); // square-equivalent side, meters
  const dLat = sideM / 2 / 111_000;
  const dLng = sideM / 2 / (111_000 * Math.cos((lat * Math.PI) / 180));
  const j = (k: number) => 0.75 + rnd(seed * 17.3 + k) * 0.5; // 0.75..1.25 jitter
  const ring: [number, number][] = [
    [lng - dLng * j(1), lat + dLat * j(2)],
    [lng + dLng * j(3), lat + dLat * j(4)],
    [lng + dLng * j(5), lat - dLat * j(6)],
    [lng - dLng * j(7), lat - dLat * j(8)],
  ];
  ring.push(ring[0]);
  return ring;
}

const PARCELS_BASE: Omit<Parcel, "boundary">[] = [
  { id: "nogal", name: "Parcela del nogal", crop: "Nogal pecanero", hectares: 9.2, stress: 0.22, lat: 28.196, lng: -105.476, irrigationSystem: "Goteo", soilType: "Franco", wellId: "grande", plantingDate: "2018-03-15" },
  { id: "alfalfa", name: "Parcela de alfalfa", crop: "Alfalfa", hectares: 7.5, stress: 0.31, lat: 28.188, lng: -105.477, irrigationSystem: "Aspersión", soilType: "Franco", wellId: "grande", plantingDate: "2024-09-01" },
  { id: "chile", name: "Parcela del chile", crop: "Chile jalapeño", hectares: 5.1, stress: 0.82, lat: 28.1875, lng: -105.464, irrigationSystem: "Goteo", soilType: "Arenoso", wellId: "chico", plantingDate: "2026-03-20" },
  { id: "manzana", name: "Huerta de manzana", crop: "Manzano", hectares: 8.0, stress: 0.45, lat: 28.1925, lng: -105.469, irrigationSystem: "Aspersión", soilType: "Arcilloso", wellId: "norte", plantingDate: "2015-02-10" },
  { id: "maiz", name: "Parcela de maíz", crop: "Maíz forrajero", hectares: 8.2, stress: 0.58, lat: 28.184, lng: -105.471, irrigationSystem: "Gravedad", soilType: "Franco", wellId: "norte", plantingDate: "2026-04-10" },
];

const PARCELS: Parcel[] = PARCELS_BASE.map((p, i) => ({
  ...p,
  boundary: p.lat != null && p.lng != null ? fieldBoundary(p.lng, p.lat, p.hectares, i + 1) : undefined,
}));

// Mutable working set so the contract methods (addParcel/removeParcel) are
// real. The live PoC also mirrors drawn parcels in the browser (localStorage).
let parcelStore: Parcel[] = [...PARCELS];

const WELLS: Well[] = [
  { id: "grande", name: "Pozo grande", currentFlowLph: 7900, sustainableFlowLph: 8200, depthM: 78, ratedStarts: 20000, starts: 12400, ok: true, lat: 28.19, lng: -105.4775 },
  { id: "chico", name: "Pozo chico", currentFlowLph: 4300, sustainableFlowLph: 4000, depthM: 120, ratedStarts: 20000, starts: 18900, ok: false, lat: 28.1935, lng: -105.4655 },
  { id: "norte", name: "Pozo norte", currentFlowLph: 5100, sustainableFlowLph: 6000, depthM: 95, ratedStarts: 18000, starts: 9800, ok: true, lat: 28.195, lng: -105.463 },
];

const REGIONS: Region[] = [
  { id: "chihuahua", name: "Chihuahua, Chihuahua", postalCode: "31000", lat: 28.635, lng: -106.089, altitudeM: 1440, et0: 6.5 },
  { id: "delicias", name: "Delicias, Chihuahua", postalCode: "33000", lat: 28.19, lng: -105.47, altitudeM: 1170, et0: 6.8 },
  { id: "camargo", name: "Camargo, Chihuahua", postalCode: "33700", lat: 27.673, lng: -105.168, altitudeM: 1240, et0: 7.1 },
  { id: "cuauhtemoc", name: "Cuauhtémoc, Chihuahua", postalCode: "31500", lat: 28.405, lng: -106.866, altitudeM: 2060, et0: 5.9 },
];

const COSTS: CostItem[] = [
  { id: "luz", label: "Luz (CFE)", icon: "bolt", month: 18450, trend: -12, note: "tarifa nocturna aprovechada" },
  { id: "agua", label: "Agua / derechos", icon: "drop", month: 6200, trend: -4, note: "cuota CONAGUA + bombeo" },
  { id: "diesel", label: "Diésel (respaldo)", icon: "fuel", month: 3100, trend: 8, note: "bomba chica sin red" },
  { id: "mano", label: "Mano de obra riego", icon: "user", month: 9800, trend: 0, note: "3 jornaleros" },
  { id: "mant", label: "Mantenimiento bombas", icon: "wrench", month: 2400, trend: -22, note: "arranques suavizados" },
];

const FORECAST: WeatherDay[] = [
  { day: "Hoy", icon: "sun", tempMax: 32, rainMm: 0 },
  { day: "Jue", icon: "rain", tempMax: 26, rainMm: 12 },
  { day: "Vie", icon: "cloud", tempMax: 28, rainMm: 3 },
  { day: "Sáb", icon: "sun", tempMax: 33, rainMm: 0 },
  { day: "Dom", icon: "sun", tempMax: 34, rainMm: 0 },
];

const SCHEDULED_ACTIONS: ScheduledAction[] = [
  { text: "Riego nocturno · Parcela del nogal", time: "02:00", tone: "emerald" },
  { text: "Bajar caudal · Pozo chico", time: "06:30", tone: "alert" },
  { text: "Pausa por lluvia prevista · 2 parcelas", time: "jueves", tone: "glacier" },
  { text: "Reparto de bombeo · Pozo grande + norte", time: "03:15", tone: "emerald" },
  { text: "Riego de la parcela del chile", time: "01:00", tone: "emerald" },
  { text: "Aviso de mantenimiento · Pozo chico", time: "viernes", tone: "alert" },
];

export class SimulatedRepository implements FarmRepository {
  async getParcels(): Promise<Parcel[]> {
    return parcelStore;
  }
  async addParcel(parcel: Parcel): Promise<void> {
    parcelStore = [...parcelStore, parcel];
  }
  async removeParcel(id: string): Promise<void> {
    parcelStore = parcelStore.filter((p) => p.id !== id);
  }
  async getWells(): Promise<Well[]> {
    return WELLS;
  }
  async getRegions(): Promise<Region[]> {
    return REGIONS;
  }
  async getCropProfile(crop: CropType): Promise<CropProfile | null> {
    return CROPS[crop] ?? null;
  }
  async getCrops(): Promise<CropProfile[]> {
    return Object.values(CROPS);
  }
  async getCosts(): Promise<CostItem[]> {
    return COSTS;
  }
  async getTariffCurve(): Promise<number[]> {
    // Simulated spot price shape (CENACE-like): cheap pre-dawn, peak evening.
    return Array.from({ length: 24 }, (_, h) => {
      const base =
        1.8 + Math.sin(((h - 15) / 24) * 6.28) * 0.9 + (h >= 18 && h <= 22 ? 0.8 : 0) - (h >= 1 && h <= 5 ? 0.5 : 0);
      return Math.max(0.6, Math.round(base * 100) / 100);
    });
  }
  async getForecast(): Promise<WeatherDay[]> {
    return FORECAST;
  }
  async getScheduledActions(): Promise<ScheduledAction[]> {
    return SCHEDULED_ACTIONS;
  }
  async getSavings(): Promise<SavingsSummary> {
    return { amountThisMonth: 2840, vsLastMonthPct: 18 };
  }
  async getKpiTrends(): Promise<KpiTrends> {
    // Recent-weeks series (simulated) feeding the KPI sparklines.
    return {
      spend: [44200, 43100, 42600, 41800, 40900, 40200, 40100, 39950],
      healthy: [3, 3, 2, 2, 3, 2, 2, 2],
      pumps: [72, 70, 69, 67, 66, 65, 64, 64],
      alerts: [0, 0, 1, 1, 0, 1, 1, 1],
    };
  }
  async getAquiferNeighborhood(): Promise<AquiferNeighborhood> {
    // Meoqui-Delicias (0833) is a real, officially overexploited aquifer.
    // Concessions are simulated/anonymized; structured for real REPDA data.
    return {
      aquiferName: "Meoqui-Delicias (0833)",
      status: "Sobreexplotado",
      decreeYear: 2020,
      totalUsersAprox: 2400,
      concessions: [
        { id: "c1", titular: "Productor agrícola (vecino N)", uso: "Agrícola", volumeM3Year: 480000, distanceKm: 1.2, status: "vigente", levelTrendMPerYear: -2.4 },
        { id: "c2", titular: "Junta de agua potable", uso: "Público urbano", volumeM3Year: 1200000, distanceKm: 3.4, status: "vigente", levelTrendMPerYear: -0.9 },
        { id: "c3", titular: "Unión de productores (nuez)", uso: "Agrícola", volumeM3Year: 920000, distanceKm: 4.1, status: "vigente", levelTrendMPerYear: -1.3 },
        { id: "c4", titular: "Empacadora regional", uso: "Industrial", volumeM3Year: 150000, distanceKm: 5.0, status: "en trámite", levelTrendMPerYear: -0.6 },
        { id: "c5", titular: "Rancho ganadero (sur)", uso: "Pecuario", volumeM3Year: 90000, distanceKm: 6.3, status: "vigente", levelTrendMPerYear: -0.4 },
      ],
    };
  }
}
