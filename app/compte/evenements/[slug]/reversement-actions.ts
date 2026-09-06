"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { soldeEurCents } from "@/lib/stripe-balance";

// Reversement manuel de la cagnotte d'un article : l'organisateur déclenche
// lui-même le virement de son compte Stripe vers son compte bancaire, article
// par article (les comptes connectés sont en payout_schedule "manual", plus
// aucun virement automatique). Voir CLAUDE.md > "Reversement manuel de la
// cagnotte par article, initié par l'organisateur".
//
// Le montant est TOUJOURS recalculé côté serveur avant l'appel Stripe —
// jamais de confiance dans une valeur venue du client, comme partout ailleurs
// dans ce produit.
export async function reverserCagnotteArticle(
  giftItemId: string,
  slug: string,
): Promise<{ error: string | null; montantCents?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // Propriété : l'article doit appartenir à une liste de cet organisateur.
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .eq("organizer_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!event) {
    return { error: "Liste introuvable." };
  }

  const admin = createAdminClient();

  const { data: item } = await admin
    .from("gift_items")
    .select("id, status, funded_amount_cents, event_id")
    .eq("id", giftItemId)
    .single();

  if (!item || item.event_id !== event.id) {
    return { error: "Cadeau introuvable." };
  }
  if (item.status !== "cagnotte") {
    return { error: "Aucune cagnotte à reverser sur ce cadeau." };
  }

  const { data: stripeAccount } = await admin
    .from("organizer_stripe_accounts")
    .select("stripe_account_id, payouts_enabled")
    .eq("organizer_id", user.id)
    .maybeSingle();

  if (!stripeAccount || !stripeAccount.payouts_enabled) {
    return {
      error:
        "Votre compte Stripe n'est pas encore prêt à recevoir des virements. Terminez sa configuration depuis « Mon compte ».",
    };
  }

  // Montant déjà reversé pour cet article (le solde Stripe est fongible au
  // niveau du compte entier, Kdovie suit la répartition par article).
  const { data: payouts } = await admin
    .from("gift_item_payouts")
    .select("amount_cents")
    .eq("gift_item_id", item.id);
  const dejaReverseCents = (payouts ?? []).reduce((s, p) => s + p.amount_cents, 0);
  const montantRestantCents = item.funded_amount_cents - dejaReverseCents;

  if (montantRestantCents <= 0) {
    return { error: "Cette cagnotte a déjà été intégralement reversée." };
  }

  // Solde réellement virable maintenant (available, pas pending).
  let disponibleCents: number;
  try {
    const balance = await stripe.balance.retrieve(undefined, {
      stripeAccount: stripeAccount.stripe_account_id,
    });
    disponibleCents = soldeEurCents(balance).disponible;
  } catch {
    return { error: "Impossible de vérifier votre solde Stripe, réessayez dans un instant." };
  }

  const montantCents = Math.min(montantRestantCents, disponibleCents);
  if (montantCents <= 0) {
    return {
      error:
        "Le montant de cette cagnotte n'est pas encore disponible : Stripe finalise les paiements les plus récents (comptez quelques jours ouvrés).",
    };
  }

  let payoutId: string;
  try {
    const payout = await stripe.payouts.create(
      {
        amount: montantCents,
        currency: "eur",
        metadata: { gift_item_id: item.id },
      },
      { stripeAccount: stripeAccount.stripe_account_id },
    );
    payoutId = payout.id;
  } catch {
    return { error: "Le virement n'a pas pu être lancé, réessayez dans un instant." };
  }

  const { error: insertError } = await admin.from("gift_item_payouts").insert({
    gift_item_id: item.id,
    stripe_payout_id: payoutId,
    amount_cents: montantCents,
  });
  if (insertError) {
    // Le virement Stripe est parti mais la trace interne a échoué — logué
    // pour rattrapage manuel plutôt qu'avalé (l'argent a bougé côté Stripe).
    console.error(
      `[reversement] virement Stripe ${payoutId} (${montantCents}c) créé mais insertion gift_item_payouts échouée pour l'article ${item.id} :`,
      insertError.message,
    );
  }

  await admin
    .from("organizer_stripe_accounts")
    .update({ last_payout_at: new Date().toISOString() })
    .eq("organizer_id", user.id);

  revalidatePath(`/compte/evenements/${slug}`);
  return { error: null, montantCents };
}
