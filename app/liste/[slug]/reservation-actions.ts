"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/send-email";
import ReservationConfirmeeEmail from "@/components/emails/ReservationConfirmeeEmail";
import { getAffiliateLink } from "@/lib/affiliate-link";
import { truncateTitle } from "@/lib/gift-item";
import { SITE_URL } from "@/lib/site-url";

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
  const email = guestEmail.trim();

  const supabase = createAdminClient();
  const { data: reservation, error } = await supabase.rpc("reserve_gift_item", {
    p_gift_item_id: giftItemId,
    p_guest_name: (nom || null) as unknown as string,
    p_guest_email: email || (null as unknown as string),
  });

  if (error) {
    return {
      error:
        "Cet article vient d'être réservé par quelqu'un d'autre — la liste va se mettre à jour.",
    };
  }

  revalidatePath(`/liste/${slug}`);
  revalidatePath(`/compte/evenements/${slug}`);

  // Confirmation de réservation, uniquement si un email a été renseigné
  // (facultatif) — voir CLAUDE.md > "Emails transactionnels".
  if (email && reservation) {
    const { data: item } = await supabase
      .from("gift_items")
      .select("title, source_url, event_id")
      .eq("id", giftItemId)
      .single();

    if (item) {
      const { data: event } = await supabase
        .from("events")
        .select("name")
        .eq("id", item.event_id)
        .single();

      const giftTitle = truncateTitle(item.title);
      const buyUrl = item.source_url ? getAffiliateLink(item.source_url) : null;
      const isAffiliate = Boolean(item.source_url && buyUrl !== item.source_url);
      const cancelUrl = `${SITE_URL}/liste/${slug}/annuler/${reservation.id}`;

      await sendTransactionalEmail({
        to: email,
        subject: `« ${giftTitle} » est réservé, merci !`,
        react: ReservationConfirmeeEmail({
          giftTitle,
          eventName: event?.name ?? "votre liste",
          buyUrl,
          isAffiliate,
          cancelUrl,
        }),
      });
    }
  }

  return { error: null };
}
