"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidAlias, normalizeAlias } from "@/lib/short-alias";

// Personnalisation du lien court kdovie.com/kdo/{alias} — voir CLAUDE.md >
// "Liens courts mémorisables". Le trigger protect_event_short_alias bloque de
// toute façon un changement après la première ouverture : la vérification ici
// sert à renvoyer un message clair.
export async function updateShortAlias(
  eventId: string,
  saisie: string,
  slug: string,
): Promise<{ error: string | null; alias?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const alias = normalizeAlias(saisie);
  if (!isValidAlias(alias)) {
    return { error: "Le lien doit faire entre 3 et 40 caractères (lettres, chiffres et tirets)." };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, short_alias, first_opened_at")
    .eq("id", eventId)
    .eq("organizer_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) return { error: "Liste introuvable." };
  if (event.first_opened_at && event.short_alias) {
    return { error: "Ce lien est définitif depuis l'ouverture de votre liste." };
  }
  if (event.short_alias === alias) return { error: null, alias };

  const { error } = await supabase.from("events").update({ short_alias: alias }).eq("id", eventId);
  if (error) {
    if (error.code === "23505") {
      return { error: "Ce lien vient d'être pris, essayez une autre version." };
    }
    return { error: "Impossible d'enregistrer ce lien, réessayez dans un instant." };
  }

  revalidatePath(`/compte/evenements/${slug}`);
  return { error: null, alias };
}
