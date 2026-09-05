import { createClient } from "@/lib/supabase/server";

// Appelée depuis l'onglet relais invisible de l'extension navigateur Chrome
// (une page kdovie.com ouverte en arrière-plan, jamais directement depuis
// le popup) — voir CLAUDE.md > "Extension navigateur Chrome" > "Onglet
// relais invisible pour l'authentification". Toujours un appel same-origin,
// aucun CORS nécessaire : le cookie de session Supabase Auth (SameSite=Lax)
// s'attache normalement, contrairement à un fetch direct depuis
// chrome-extension://.
//
// Authentification par session partagée avec kdovie.com — jamais de flux de
// connexion propre à l'extension. Si aucune session : `{ connecte: false }`,
// le popup affiche alors une simple invitation à se connecter sur kdovie.com.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ connecte: false });
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

  return Response.json({ connecte: true, listes: listes ?? [] });
}
