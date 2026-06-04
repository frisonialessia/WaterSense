// ============================================================
// WaterSense — Domain types
// The single source of truth for the shapes the brain works with.
// Designed so that real data (Supabase rows, sensor payloads,
// CONAGUA records) maps onto these without changing the logic.
// ============================================================

export type CropType =
  | "Nogal pecanero"
  | "Alfalfa"
  | "Chile jalapeño"
  | "Manzano"
  | "Maíz forrajero"
  | "Algodón"
  | "Sorgo forrajero"
  | "Avena forrajera"
  | "Frijol"
  | "Cebolla"
  | "Calabaza"
  | "Sandía"
  | "Papa"
  | "Fresa"
  | "Trigo"
  | "Ganadería (pastizal)"
  | "Otro";

export interface CropProfile {
  crop: CropType;
  /** annual irrigation depth, meters */
  laminaM: number;
  /** m³ of water per hectare per year */
  waterM3ha: number;
  /** annual irrigation cost $/ha (water + energy) */
  costHa: number;
  /** days between waterings */
  freqDays: number;
  /** expected yield kg/ha */
  yieldKgHa: number;
  /** farm-gate price, $/kg (simulated, realistic for Chihuahua) */
  pricePerKg: number;
}

export type IrrigationSystem = "Goteo" | "Aspersión" | "Gravedad";
export type SoilType = "Arenoso" | "Franco" | "Arcilloso";
export type TariffType = "Nocturna (CFE)" | "Horaria" | "Fija";

export interface Parcel {
  id: string;
  name: string;
  crop: CropType;
  hectares: number;
  /** 0..1 water-stress index (NDWI-like). Higher = drier. */
  stress: number;
  lat?: number;
  lng?: number;
  /**
   * Field outline as a ring of [lng, lat] points (GeoJSON order).
   * Today these are simulated around the centroid; with Supabase this
   * is the polygon the farmer drew on the map.
   */
  boundary?: [number, number][];
  /** irrigation method — changes water efficiency */
  irrigationSystem?: IrrigationSystem;
  /** soil texture — changes watering frequency */
  soilType?: SoilType;
  /** planting date (ISO) — derives the crop growth stage */
  plantingDate?: string;
  /** well that irrigates this parcel (links consumption ↔ pump) */
  wellId?: string;
}

export interface Well {
  id: string;
  name: string;
  /** current extraction rate, liters/hour */
  currentFlowLph: number;
  /** sustainable extraction rate, liters/hour */
  sustainableFlowLph: number;
  /** depth to water table, meters */
  depthM: number;
  /** rated lifetime starts of the pump */
  ratedStarts: number;
  /** accumulated starts */
  starts: number;
  ok: boolean;
  lat?: number;
  lng?: number;
}

export interface TariffWindow {
  pricePerKwh: number;
  startsInHours: number;
  durationHours: number;
}

export interface Region {
  id: string;
  name: string;
  postalCode: string;
  lat: number;
  lng: number;
  altitudeM: number;
  /** reference evapotranspiration, mm/day */
  et0: number;
}

export interface CostItem {
  id: string;
  /** human label, e.g. "Luz (CFE)" */
  label: string;
  /** icon name used by the UI (see components/Icon) */
  icon: string;
  /** this month's cost, $ */
  month: number;
  /** percentage change vs. previous month (negative = cheaper) */
  trend: number;
  /** short human note, e.g. "tarifa nocturna aprovechada" */
  note: string;
}

export interface WeatherDay {
  /** short label, e.g. "Hoy", "Jue" */
  day: string;
  /** icon name: sun | rain | cloud */
  icon: string;
  tempMax: number;
  /** forecast rainfall, mm */
  rainMm: number;
}

export interface ScheduledAction {
  /** human description of what WaterSense will do */
  text: string;
  /** when, e.g. "02:00" or "jueves" */
  time: string;
  /** tone for the dot: emerald | alert | glacier */
  tone: "emerald" | "alert" | "glacier";
}

export interface SavingsSummary {
  /** money saved this month vs. the old watering pattern, $ */
  amountThisMonth: number;
  /** change vs. last month, percentage points */
  vsLastMonthPct: number;
}

/** A water-rights concession near the farm (REPDA-style, simulated). */
export interface WaterConcession {
  id: string;
  /** holder (anonymized for the demo) */
  titular: string;
  uso: "Agrícola" | "Público urbano" | "Industrial" | "Pecuario";
  /** concessioned annual volume, m³/year */
  volumeM3Year: number;
  /** distance from the farm, km */
  distanceKm: number;
  status: "vigente" | "en trámite" | "vencida";
  /** recent change in their water table, m/year (negative = dropping fast) */
  levelTrendMPerYear?: number;
}

/** The aquifer the farm shares + who else draws from it (REPDA/CONAGUA). */
export interface AquiferNeighborhood {
  aquiferName: string;
  status: "Sobreexplotado" | "En equilibrio" | "Subexplotado";
  /** year of the CONAGUA availability decree (DOF) */
  decreeYear: number;
  /** approximate number of registered users on the aquifer */
  totalUsersAprox: number;
  concessions: WaterConcession[];
}

/** User-editable ranch settings (persisted client-side in the PoC). */
export interface RanchConfig {
  name: string;
  owner: string;
  regionId: string;
  lat: number;
  lng: number;
  altitudeM: number;
  hectares: number;
  mainCrop: CropType;
  /** contracted CFE tariff — refines the energy savings */
  tariffType: TariffType;
  notes: string;
}

/** Short historical series (recent weeks) backing the KPI sparklines. */
export interface KpiTrends {
  /** monthly spend, $ */
  spend: number[];
  /** count of healthy parcels */
  healthy: number[];
  /** average pump health, % */
  pumps: number[];
  /** wells over the sustainable limit */
  alerts: number[];
}
