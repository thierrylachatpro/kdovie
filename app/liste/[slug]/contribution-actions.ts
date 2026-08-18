"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import {
  computeApplicationFeeAmountCents,
  computeMontantPreleveCents,
  type FeeMode,
} from "@/lib/fee-calculation";

// Écriture réservée au service_role (jamais d'appel Stripe/RPC direct depuis
// le navigateur), voir CLAUDE.md > tâche #17 (même principe pour #18).
export async function createContribution(
  giftItemId: string,
  guestName: string,
  guestEmail: string,
  montantNetCents: number,
): Promise<{ error: string | null; clientSecret?: string; montantPreleveCents?: number }> {
  const nom = guestName.trim();
  if (!nom) {
    return { error: "Merci d'indiquer votre prénom et nom." };
  }
  if (!Number.isFinite(montantNetCents) || montantNetCents < 100) {
    return { error: "Le montant minimum est de 1 €." };
  }

  const admin = createAdminClient();

  const { data: giftItem } = await admin
    .from("gift_items")
    .select("id, mode, status, event_id")
    .eq("id", giftItemId)
    .single();

  if (!giftItem) {
    return { error: "Cadeau introuvable." };
  }
  if (giftItem.status === "reserve" || giftItem.mode === "cotisation_impossible") {
    return { error: "La cotisation n'est plus possible pour ce cadeau." };
  }

  const { data: event } = await admin
    .from("events")
    .select("id, organizer_id, fee_mode")
    .eq("id", giftItem.event_id)
    .single();

  if (!event) {
    return { error: "Liste introuvable." };
  }

  const { data: stripeAccount } = await admin
    .from("organizer_stripe_accounts")
    .select("stripe_account_id")
    .eq("organizer_id", event.organizer_id)
    .maybeSingle();

  if (!stripeAccount) {
    return { error: "L'organisateur n'a pas encore activé les cagnottes sur cette liste." };
  }

  const montantPreleveCents = computeMontantPreleveCents(
    montantNetCents,
    event.fee_mode as FeeMode,
  );
  const applicationFeeAmountCents = computeApplicationFeeAmountCents(montantPreleveCents);

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: montantPreleveCents,
      currency: "eur",
      application_fee_amount: applicationFeeAmountCents,
      transfer_data: { destination: stripeAccount.stripe_account_id },
      on_behalf_of: stripeAccount.stripe_account_id,
      metadata: {
        gift_item_id: giftItem.id,
        event_id: event.id,
      },
    });
  } catch {
    // Ex. compte Stripe de l'organisateur créé mais onboarding pas encore
    // commencé (capacité transfers pas encore active) — message clair plutôt
    // qu'une erreur brute, voir CLAUDE.md > tâche #17 (même principe pour #18).
    return {
      error:
        "L'organisateur n'a pas encore terminé la configuration de sa cagnotte, réessayez plus tard.",
    };
  }

  const { data: contribution, error: contribError } = await admin
    .from("contributions")
    .insert({
      gift_item_id: giftItem.id,
      guest_name: nom,
      guest_email: guestEmail.trim() || null,
      amount_cents: montantNetCents,
      status: "pending",
      stripe_payment_intent_id: paymentIntent.id,
    })
    .select("id")
    .single();

  if (contribError || !contribution) {
    return { error: "Impossible de préparer la cotisation, réessayez." };
  }

  return {
    error: null,
    clientSecret: paymentIntent.client_secret!,
    montantPreleveCents,
  };
}
