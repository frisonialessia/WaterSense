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
  | "Maíz forrajero";

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
}

export interface Parcel {
  id: string;
  name: string;
  crop: CropType;
  hectares: number;
  /** 0..1 water-stress index (NDWI-like). Higher = drier. */
  stress: number;
  lat?: number;
  lng?: number;
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
