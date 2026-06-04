// ============================================================
// WaterSense — Auth (PLANTILLA, lista para conectar)
// ------------------------------------------------------------
// Envoltura ligera sobre Supabase Auth. NO se usa en el demo
// (corre sin login, datos simulados). El día que conectes datos
// reales, esto da identidad por usuario y, junto con las políticas
// RLS de supabase/schema.sql, cada quien ve solo sus ranchos.
//
// Uso (cuando esté configurado .env.local):
//   import { auth } from "@/lib/data/auth";
//   await auth.signInWithEmail(email, password);
//   const user = await auth.getUser();
// ============================================================

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Cliente de navegador (anon key). Lanza si faltan las variables. */
function browserClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Auth no configurado: falta NEXT_PUBLIC_SUPABASE_URL / ANON_KEY en .env.local.");
  }
  client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

/** ¿Está Supabase configurado? Permite que la app caiga al modo demo si no. */
export function authConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const auth = {
  signUpWithEmail: async (email: string, password: string) => {
    const { data, error } = await browserClient().auth.signUp({ email, password });
    if (error) throw error;
    return data.user;
  },
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await browserClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },
  signInWithOtp: async (phone: string) => {
    // SMS/WhatsApp OTP — útil para productores sin correo.
    const { error } = await browserClient().auth.signInWithOtp({ phone });
    if (error) throw error;
  },
  signOut: async () => {
    await browserClient().auth.signOut();
  },
  getUser: async (): Promise<User | null> => {
    const { data } = await browserClient().auth.getUser();
    return data.user ?? null;
  },
  onAuthChange: (cb: (user: User | null) => void) => {
    const { data } = browserClient().auth.onAuthStateChange((_e, session) => cb(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  },
};
