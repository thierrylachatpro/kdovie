import { createClient } from "@/lib/supabase/server";
import { corsHeadersFor, corsJson } from "@/lib/cors";

// Appelée par le popup/background de l'extension navigateur Chrome à son
// ouverture, voir CLAUDE.md > "Extension navigateur Chrome". Authentification
// par session partagée avec kdovie.com (cookie Supabase Auth déjà posé si
// l'organisateur est connecté dans ce même navigateur) — jamais de flux de
// connexion propre à l'extension. Si aucune session : `{ connecte: false }`,
// le popup affiche alors une simple invitation à se connecter sur kdovie.com.
export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return corsJson(origin, { connecte: false });
  }

  // Même requête que le dashboard /compte : toutes les listes non supprimées,
  // brouillon comme ouverte — l'extension ne restreint pas par statut (voir
  // CLAUDE.md, "aucune restriction de statut, cohérent avec le comportement
  // déjà en place sur la page de gestion").
  const { data: listes } = await supabase
    .from("events")
    .select("id, slug, name, status")
    .eq("organizer_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return corsJson(origin, { connecte: true, listes: listes ?? [] });
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeadersFor(request.headers.get("origin")) });
}
