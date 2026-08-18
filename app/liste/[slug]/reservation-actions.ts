"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Passe par le client service_role (jamais un appel RPC direct depuis le
// navigateur) pour garder la validation côté serveur, voir CLAUDE.md > tâche #17.
export async function reserveGiftItem(
  giftItemId: string,
  slug: string,
  guestName: string,
  guestEmail: string,
): Promise<{ error: string | null }> {
  // Prénom/nom facultatif depuis le 18 août 2026 (voir CLAUDE.md >
  // "Ajustements listes publique et gestion") — "Anonyme" affiché côté app
  // quand vide.
  const nom = guestName.trim();

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("reserve_gift_item", {
    p_gift_item_id: giftItemId,
    p_guest_name: (nom || null) as unknown as string,
    p_guest_email: guestEmail.trim() || (null as unknown as string),
  });

  if (error) {
    return {
      error:
        "Cet article vient d'être réservé par quelqu'un d'autre — la liste va se mettre à jour.",
    };
  }

  revalidatePath(`/liste/${slug}`);
  revalidatePath(`/compte/evenements/${slug}`);

  return { error: null };
}
