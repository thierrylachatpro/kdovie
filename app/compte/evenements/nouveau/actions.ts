"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPES } from "@/lib/event-types";
import { generateEventSlug } from "@/lib/slug";

// Nombre maximal de tentatives en cas de collision sur le slug généré.
// generateEventSlug ajoute déjà un suffixe aléatoire de 5 caractères — une
// collision est déjà extrêmement improbable, ces quelques essais
// supplémentaires suffisent largement à couvrir la malchance résiduelle
// sans jamais avoir à demander quoi que ce soit à l'organisateur (voir
// CLAUDE.md, retrait du champ "Lien de la liste" du formulaire).
const MAX_TENTATIVES_SLUG = 5;

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const typeSubmitted = formData.get("type")?.toString() ?? "";
  const type = typeSubmitted || null;
  const name = formData.get("name")?.toString().trim() ?? "";
  const eventDate = formData.get("event_date")?.toString() || null;

  if ((type !== null && !EVENT_TYPES.some((t) => t.id === type)) || !name) {
    redirect("/compte/evenements/nouveau?erreur=champs_invalides");
  }

  let slugCree: string | null = null;
  for (let tentative = 0; tentative < MAX_TENTATIVES_SLUG; tentative++) {
    const slug = generateEventSlug(name);
    const { data, error } = await supabase
      .from("events")
      .insert({
        organizer_id: user.id,
        type,
        name,
        event_date: eventDate,
        slug,
      })
      .select("slug")
      .single();

    if (!error) {
      slugCree = data.slug;
      break;
    }

    // Collision de slug : on retente silencieusement avec un nouveau
    // suffixe. Toute autre erreur n'a aucune chance d'être résolue par un
    // nouvel essai, inutile d'insister.
    if (error.code !== "23505") {
      redirect("/compte/evenements/nouveau?erreur=erreur");
    }
  }

  if (!slugCree) {
    redirect("/compte/evenements/nouveau?erreur=erreur");
  }

  redirect(`/compte/evenements/${slugCree}`);
}
