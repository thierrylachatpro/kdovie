"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Remplace updateDisplayName (pseudo) — voir CLAUDE.md > "Recherche
// publique d'organisateurs par nom et ville". profiles.display_name reste
// en base telle quelle (rien à migrer rétroactivement) mais n'est plus
// écrite depuis cette page.
export async function updateIdentite(data: {
  firstName: string;
  lastName: string;
  postalCode: string;
  city: string;
  searchable: boolean;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const postalCode = data.postalCode.trim();
  const city = data.city.trim();

  if (!firstName) {
    return { error: "Le prénom est obligatoire." };
  }

  // La visibilité dans la recherche exige nom + ville, sinon la fiche
  // resterait techniquement "trouvable" sans être réellement exploitable —
  // revalidé ici, jamais uniquement côté formulaire.
  if (data.searchable && (!lastName || !postalCode || !city)) {
    return {
      error: "Pour être trouvable, indiquez aussi votre nom et votre ville.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName || null,
      postal_code: postalCode || null,
      city: city || null,
      searchable: data.searchable,
    })
    .eq("id", user.id);

  if (!error) {
    revalidatePath("/compte/profil");
    revalidatePath("/compte");
  }

  return { error: error?.message ?? null };
}
