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

export const repository: FarmRepository = new SimulatedRepository();
