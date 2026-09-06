"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// Ouvre le Dashboard Express de l'organisateur (solde, versements à venir,
// coordonnées bancaires, historique) via un lien de connexion à usage
// unique — réservé au statut "actif" du bloc "Ma cagnotte".
//
// Les statuts "aucun"/"en_attente" passent par l'onboarding embarqué
// (StripeEmbeddedOnboarding + app/api/stripe/account-session), jamais par
// ici — voir CLAUDE.md > "Onboarding Stripe Connect embarqué". D'où la
// suppression de l'ancien startStripeOnboarding (Account Link
// `type: "account_onboarding"`), qui renvoyait toujours vers le formulaire
// de configuration, jamais vers le solde.
export async function openStripeExpressDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: stripeAccount } = await supabase
    .from("organizer_stripe_accounts")
    .select("stripe_account_id")
    .eq("organizer_id", user.id)
    .maybeSingle();

  if (!stripeAccount) {
    redirect("/compte/profil?erreur=stripe_compte");
  }

  let url: string;
  try {
    const loginLink = await stripe.accounts.createLoginLink(stripeAccount.stripe_account_id);
    url = loginLink.url;
  } catch {
    redirect("/compte/profil?erreur=stripe_dashboard");
  }

  redirect(url);
}
