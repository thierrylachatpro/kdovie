"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// Annulation en libre-service par l'invité, depuis le lien reçu dans
// l'email de confirmation de réservation — voir CLAUDE.md > "Emails
// transactionnels". Jamais pour une cotisation (argent déjà transféré via
// Stripe, non annulable ici). La logique de déverrouillage (statut,
// index unique partiel) vit exclusivement dans cancel_reservation
// (migration 0017), jamais dupliquée ici.
export async function cancelReservation(reservationId: string, slug: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("cancel_reservation", {
    p_reservation_id: reservationId,
  });

  if (error) {
    redirect(`/liste/${slug}/annuler/${reservationId}?erreur=1`);
  }

  revalidatePath(`/liste/${slug}`);
  revalidatePath(`/compte/evenements/${slug}`);
  redirect(`/liste/${slug}?annulation=succes`);
}
