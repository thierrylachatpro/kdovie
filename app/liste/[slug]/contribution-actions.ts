"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import {
  computeApplicationFeeAmountCents,
  computeMontantPreleveCents,
  type FeeMode,
} from "@/lib/fee-calculation";

// Écriture réservée au service_role (jamais d'appel Stripe/RPC direct depuis
// le navigateur), voir CLAUDE.md > tâche #17 (même principe pour #18).
//
// Paiement via Stripe Checkout (page hébergée par Stripe, redirection
// complète) plutôt que Payment Element embarqué dans la modale — décision du
// 18 août 2026 : rassure davantage l'invité de ne jamais saisir son numéro
// de carte sur kdovie.com. Restreint à `card` uniquement (Klarna/Bancontact
// etc. non proposés pour l'instant, PayPal prévu plus tard).
export async function createContribution(
  giftItemId: string,
  slug: string,
  guestName: string,
  guestEmail: string,
  montantNetCents: number,
): Promise<{ error: string | null; checkoutUrl?: string }> {
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
    .select("id, title, mode, status, event_id")
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

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const listeUrl = `${protocol}://${host}/liste/${slug}`;

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Cotisation pour « ${giftItem.title} »` },
            unit_amount: montantPreleveCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmountCents,
        transfer_data: { destination: stripeAccount.stripe_account_id },
        on_behalf_of: stripeAccount.stripe_account_id,
        metadata: {
          gift_item_id: giftItem.id,
          event_id: event.id,
        },
      },
      customer_email: guestEmail.trim() || undefined,
      success_url: `${listeUrl}?cotisation=succes`,
      cancel_url: `${listeUrl}?cotisation=annulee`,
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

  if (!session.url || !session.payment_intent) {
    return { error: "Impossible de préparer le paiement, réessayez." };
  }

  const { error: contribError } = await admin.from("contributions").insert({
    gift_item_id: giftItem.id,
    guest_name: nom,
    guest_email: guestEmail.trim() || null,
    amount_cents: montantNetCents,
    status: "pending",
    stripe_payment_intent_id: session.payment_intent as string,
  });

  if (contribError) {
    return { error: "Impossible de préparer la cotisation, réessayez." };
  }

  return { error: null, checkoutUrl: session.url };
}
