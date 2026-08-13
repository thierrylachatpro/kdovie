import { createClient } from "@supabase/supabase-js";

// Client côté navigateur (clé publique anon, respecte les Row Level Security policies)
export const supabaseBrowser = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

// Client côté serveur (clé service_role, à n'utiliser que dans des Route Handlers / Server Actions,
// jamais exposée au navigateur — bypass les RLS, donc à manier avec précaution)
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
