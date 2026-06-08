// ============================================================
// WaterSense — The repository swap point (now tenant-aware)
// ------------------------------------------------------------
// Antes: una ÚNICA instancia global (singleton) sin noción de usuario.
// Eso funciona para un demo monousuario, pero rompe en cuanto hay un
// segundo usuario (todos verían los mismos datos).
//
// Ahora: una FACTORY. `getRepository(ctx)` devuelve un repositorio
// scopeado al tenant autenticado cuando hay sesión + Supabase, y cae
// al SimulatedRepository (demo, sin config) en cualquier otro caso.
//
// Compatibilidad: la export `repository` (demo) se mantiene para el
// código existente. El código nuevo debe usar `getRepository(ctx)`.
// ============================================================

import type { FarmRepository } from "./FarmRepository";
import { SimulatedRepository } from "./SimulatedRepository";
import { SupabaseRepository } from "./SupabaseRepository";
import { supabaseConfigured, makeUserClient, type TenantContext } from "@/lib/security/authContext";

// Instancia de demo (datos simulados, sin BD ni claves). Singleton.
const simulated = new SimulatedRepository();

/** Repositorio de demo. Compatibilidad hacia atrás (código server-side existente). */
export const repository: FarmRepository = simulated;

/**
 * Devuelve el repositorio correcto para esta petición.
 *
 * - Con `ctx` autenticado + Supabase configurado → SupabaseRepository
 *   creado con el JWT del usuario, de modo que las políticas RLS de
 *   `supabase/schema.sql` aíslan los datos por organización.
 * - En cualquier otro caso (demo, sin login, sin Supabase) → simulado.
 *
 * Así el mismo código sirve para el demo de hoy y el SaaS multi-tenant
 * de mañana, sin reescrituras y sin pagar nada hasta activar Supabase.
 */
export function getRepository(ctx?: TenantContext | null): FarmRepository {
  if (ctx?.accessToken && supabaseConfigured()) {
    // Cliente scopeado al usuario → RLS activo (no service role).
    return new SupabaseRepository(makeUserClient(ctx.accessToken));
  }
  return simulated;
}
