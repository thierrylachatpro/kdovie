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
  const nom = guestName.trim();
  if (!nom) {
    return { error: "Merci d'indiquer votre prénom et nom." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("reserve_gift_item", {
    p_gift_item_id: giftItemId,
    p_guest_name: nom,
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
