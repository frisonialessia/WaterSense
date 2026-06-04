// ============================================================
// WaterSense — The repository swap point (the ONE line to change)
// ------------------------------------------------------------
// The whole app reads farm data through `repository`. Today it is the
// SimulatedRepository (realistic Chihuahua values, no DB, no keys).
//
// To use real data, implement FarmRepository (e.g. SupabaseRepository)
// and swap the single line below. Nothing in the brain, the API routes
// or the UI changes. See README → "Conectar tu base de datos".
// ============================================================

import type { FarmRepository } from "./FarmRepository";
import { SimulatedRepository } from "./SimulatedRepository";
// import { SupabaseRepository } from "./SupabaseRepository";

export const repository: FarmRepository = new SimulatedRepository();

// ── Para usar datos reales con Supabase, comenta la línea de arriba,
//    descomenta el import y usa esta (corre antes supabase/schema.sql
//    y rellena .env.local — ver README → "Conectar Supabase"):
// export const repository: FarmRepository = new SupabaseRepository();
