// ============================================================
// WaterSense — Simulated repository
// Realistic Chihuahua values. Swap for SupabaseRepository when
// the database is connected — see README "Conectar Supabase".
// ============================================================

import type { FarmRepository } from "./FarmRepository";
import type { Parcel, Well, Region, CropProfile, CropType } from "@/types/domain";

const CROPS: Record<CropType, CropProfile> = {
  "Nogal pecanero": { crop: "Nogal pecanero", laminaM: 1.9, waterM3ha: 19000, costHa: 14200, freqDays: 7, yieldKgHa: 3200 },
  "Alfalfa": { crop: "Alfalfa", laminaM: 1.7, waterM3ha: 17000, costHa: 12800, freqDays: 10, yieldKgHa: 18000 },
  "Chile jalapeño": { crop: "Chile jalapeño", laminaM: 0.8, waterM3ha: 8000, costHa: 6400, freqDays: 4, yieldKgHa: 28000 },
  "Manzano": { crop: "Manzano", laminaM: 1.1, waterM3ha: 11000, costHa: 8900, freqDays: 8, yieldKgHa: 35000 },
  "Maíz forrajero": { crop: "Maíz forrajero", laminaM: 1.0, waterM3ha: 10000, costHa: 7600, freqDays: 6, yieldKgHa: 55000 },
};

const PARCELS: Parcel[] = [
  { id: "nogal", name: "Parcela del nogal", crop: "Nogal pecanero", hectares: 9.2, stress: 0.22, lat: 28.196, lng: -105.476 },
  { id: "alfalfa", name: "Parcela de alfalfa", crop: "Alfalfa", hectares: 7.5, stress: 0.31, lat: 28.188, lng: -105.477 },
  { id: "chile", name: "Parcela del chile", crop: "Chile jalapeño", hectares: 5.1, stress: 0.82, lat: 28.1875, lng: -105.464 },
  { id: "manzana", name: "Huerta de manzana", crop: "Manzano", hectares: 8.0, stress: 0.45, lat: 28.1925, lng: -105.469 },
  { id: "maiz", name: "Parcela de maíz", crop: "Maíz forrajero", hectares: 8.2, stress: 0.58, lat: 28.184, lng: -105.471 },
];

const WELLS: Well[] = [
  { id: "grande", name: "Pozo grande", currentFlowLph: 7900, sustainableFlowLph: 8200, depthM: 78, ratedStarts: 20000, starts: 12400, ok: true },
  { id: "chico", name: "Pozo chico", currentFlowLph: 4300, sustainableFlowLph: 4000, depthM: 120, ratedStarts: 20000, starts: 18900, ok: false },
  { id: "norte", name: "Pozo norte", currentFlowLph: 5100, sustainableFlowLph: 6000, depthM: 95, ratedStarts: 18000, starts: 9800, ok: true },
];

const REGIONS: Region[] = [
  { id: "chihuahua", name: "Chihuahua, Chihuahua", postalCode: "31000", lat: 28.635, lng: -106.089, altitudeM: 1440, et0: 6.5 },
  { id: "delicias", name: "Delicias, Chihuahua", postalCode: "33000", lat: 28.19, lng: -105.47, altitudeM: 1170, et0: 6.8 },
  { id: "camargo", name: "Camargo, Chihuahua", postalCode: "33700", lat: 27.673, lng: -105.168, altitudeM: 1240, et0: 7.1 },
  { id: "cuauhtemoc", name: "Cuauhtémoc, Chihuahua", postalCode: "31500", lat: 28.405, lng: -106.866, altitudeM: 2060, et0: 5.9 },
];

export class SimulatedRepository implements FarmRepository {
  async getParcels(): Promise<Parcel[]> {
    return PARCELS;
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
}

// single shared instance used by API routes today
export const repository: FarmRepository = new SimulatedRepository();
