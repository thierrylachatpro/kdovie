"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site-url";
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

  // business_profile.url à partir de SITE_URL, jamais de l'en-tête `host` :
  // Stripe rejette `http://localhost:3000` (`url_invalid`) — voir
  // app/api/stripe/account-session/route.ts et CLAUDE.md (incident du
  // 6 septembre 2026). Le returnUrl ci-dessous, lui, reste basé sur `host`
  // (on veut revenir sur l'environnement d'où vient l'organisateur).
  const { data: firstEvent } = await supabase
    .from("events")
    .select("slug")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const businessUrl = firstEvent
    ? `${SITE_URL}/liste/${firstEvent.slug}`
    : SITE_URL;

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
