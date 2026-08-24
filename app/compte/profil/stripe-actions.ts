"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { ensureOrganizerStripeAccount } from "@/lib/stripe-connect-account";

// Conservé uniquement pour le statut "actif" (bouton "Gérer mon compte
// Stripe") — les statuts "aucun"/"en_attente" passent désormais par
// l'onboarding embarqué (StripeEmbeddedOnboarding + app/api/stripe/account-session,
// jamais de redirection hors de kdovie.com), voir CLAUDE.md > "Onboarding
// Stripe Connect embarqué, sans quitter Kdovie". La création de compte est
// partagée avec ce nouveau flux via ensureOrganizerStripeAccount, pas
// dupliquée ici.
export async function startStripeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";

  const { data: firstEvent } = await supabase
    .from("events")
    .select("slug")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const businessUrl = firstEvent
    ? `${protocol}://${host}/liste/${firstEvent.slug}`
    : `${protocol}://${host}`;

  let stripeAccountId: string;
  try {
    stripeAccountId = await ensureOrganizerStripeAccount(user.id, user.email, businessUrl);
  } catch {
    redirect("/compte/profil?erreur=stripe_compte");
  }

  const returnUrl = `${protocol}://${host}/compte/profil`;

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}
