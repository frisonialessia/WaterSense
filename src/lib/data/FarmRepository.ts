// ============================================================
// WaterSense — Data repository (the swap seam)
// The brain and API routes depend ONLY on this interface.
// Today it returns simulated data; the day Supabase is ready,
// we add a SupabaseRepository implementing the same interface
// and nothing else changes.
// ============================================================

import type { Parcel, Well, Region, CropProfile, CropType, CostItem } from "@/types/domain";

export interface FarmRepository {
  getParcels(): Promise<Parcel[]>;
  getWells(): Promise<Well[]>;
  getRegions(): Promise<Region[]>;
  getCropProfile(crop: CropType): Promise<CropProfile | null>;
  getCrops(): Promise<CropProfile[]>;
  getCosts(): Promise<CostItem[]>;
  /** 24 hourly electricity prices ($/kWh), index 0..23. */
  getTariffCurve(): Promise<number[]>;
}
