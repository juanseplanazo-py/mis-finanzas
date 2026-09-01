import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true si las variables de entorno de Supabase están cargadas. */
export const supabaseConfigured = Boolean(url && anonKey);

// App personal de un solo usuario, protegida con Supabase Auth (email + password).
// La sesión se persiste (localStorage) para que sobreviva al cerrar la PWA en el celular.
// Si faltan las variables usamos placeholders para no romper el build.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
