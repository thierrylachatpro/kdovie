import { createClient } from "@/lib/supabase/server";

// Vérifie que l'utilisateur connecté est super-administrateur —
// re-vérifié côté serveur à chaque appel (page ET actions serveur), jamais
// une policy RLS ouverte sur les listes d'autrui, voir CLAUDE.md >
// "Dashboard super-administrateur".
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return profile?.is_admin === true;
}
