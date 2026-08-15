import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Clé service_role : à n'utiliser que dans des Route Handlers / Server Actions,
// jamais exposée au navigateur — bypass les RLS, donc à manier avec précaution.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
