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
  // Prénom/nom facultatif depuis le 18 août 2026 (voir CLAUDE.md >
  // "Ajustements listes publique et gestion") — "Anonyme" affiché côté app
  // quand vide.
  const nom = guestName.trim();
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

  // La contribution est créée avant la Checkout Session (pas après) : son id
  // sert de `client_reference_id` pour que le webhook retrouve la bonne
  // ligne. Stripe ne crée le PaymentIntent de la session que lorsqu'elle est
  // effectivement utilisée par l'invité — `session.payment_intent` est
  // toujours `null` juste après `sessions.create`, on ne peut donc pas s'en
  // servir ici pour la corrélation.
  const { data: contribution, error: contribError } = await admin
    .from("contributions")
    .insert({
      gift_item_id: giftItem.id,
      guest_name: nom || null,
      guest_email: guestEmail.trim() || null,
      amount_cents: montantNetCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (contribError || !contribution) {
    return { error: "Impossible de préparer la cotisation, réessayez." };
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: contribution.id,
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
    // La ligne contributions reste 'pending', jamais confirmée — sans effet
    // sur gift_items, pas besoin de la nettoyer.
    return {
      error:
        "L'organisateur n'a pas encore terminé la configuration de sa cagnotte, réessayez plus tard.",
    };
  }

  if (!session.url) {
    return { error: "Impossible de préparer le paiement, réessayez." };
  }

  return { error: null, checkoutUrl: session.url };
}
