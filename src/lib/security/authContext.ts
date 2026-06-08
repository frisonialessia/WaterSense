// ============================================================
// WaterSense — Contexto de tenant (multi-usuario), inerte sin config
// ------------------------------------------------------------
// El arreglo arquitectónico #1: que el backend sepa QUIÉN pide los
// datos, para que cada quien vea solo lo suyo. Hoy el demo corre sin
// login: estas funciones devuelven `null` y la app cae al repositorio
// simulado. Cuando configures Supabase Auth, empiezan a resolver al
// usuario real y RLS hace el resto.
//
// Diseño "sin pagar todavía":
//   • Sin NEXT_PUBLIC_SUPABASE_* → todo devuelve null (modo demo).
//   • Con Supabase configurado → valida el JWT del request y crea un
//     cliente CON EL TOKEN DEL USUARIO (no service role), de modo que
//     las políticas RLS de supabase/schema.sql SÍ se apliquen.
// ============================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MembershipRole } from "@/lib/billing/tiers";

export interface TenantContext {
  userId: string;
  /** organización activa (resuelta desde memberships en Fase 1) */
  orgId: string | null;
  role: MembershipRole;
  /** JWT del usuario, para crear clientes Supabase scopeados por RLS */
  accessToken: string;
}

/** ¿Está Supabase configurado? Si no, la app corre en modo demo. */
export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Cliente Supabase con el JWT del usuario → RLS aplica. NUNCA service role aquí. */
export function makeUserClient(accessToken: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

/**
 * Resuelve el tenant desde `Authorization: Bearer <jwt>` de un request.
 * Inerte por diseño: devuelve null si Supabase no está configurado o si el
 * token falta/!es válido, para que el demo (sin login) siga funcionando.
 *
 * Útil HOY para la API de dispositivos/integraciones. Para sesiones de
 * navegador (cookies) en Fase 1, añade @supabase/ssr + middleware.ts y
 * resuelve el contexto desde la cookie de sesión.
 */
export async function getTenantContextFromRequest(req: Request): Promise<TenantContext | null> {
  if (!supabaseConfigured()) return null;

  const authz = req.headers.get("authorization") ?? "";
  const token = authz.toLowerCase().startsWith("bearer ") ? authz.slice(7).trim() : "";
  if (!token) return null;

  try {
    const sb = makeUserClient(token);
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) return null;

    // TODO(Fase 1): resolver orgId + role reales desde la tabla `memberships`
    // (select org_id, role from memberships where user_id = data.user.id).
    return { userId: data.user.id, orgId: null, role: "owner", accessToken: token };
  } catch {
    return null;
  }
}
