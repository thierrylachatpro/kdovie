"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// Émet un lien de connexion à usage unique vers le Dashboard Express de
// l'organisateur (solde, versements, coordonnées bancaires, historique) —
// réservé au statut "actif" du bloc "Ma cagnotte". Retourne l'URL plutôt
// que de rediriger : le composant client l'ouvre dans un nouvel onglet.
//
// Les statuts "aucun"/"en_attente" passent par l'onboarding embarqué
// (StripeEmbeddedOnboarding + app/api/stripe/account-session), jamais par
// ici — voir CLAUDE.md > "Onboarding Stripe Connect embarqué".
export async function openStripeExpressDashboard(): Promise<{
  error: string | null;
  url?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Votre session a expiré, reconnectez-vous." };
  }

  const { data: stripeAccount } = await supabase
    .from("organizer_stripe_accounts")
    .select("stripe_account_id")
    .eq("organizer_id", user.id)
    .maybeSingle();

  if (!stripeAccount) {
    return { error: "Aucun compte Stripe n'est associé à votre compte." };
  }

  try {
    const loginLink = await stripe.accounts.createLoginLink(stripeAccount.stripe_account_id);
    return { error: null, url: loginLink.url };
  } catch {
    return { error: "Impossible d'ouvrir votre compte Stripe, réessayez dans un instant." };
  }
}
