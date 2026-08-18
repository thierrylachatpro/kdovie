"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

// Écriture réservée au service_role : aucune policy insert/update sur
// organizer_stripe_accounts pour les utilisateurs authentifiés, voir
// supabase/migrations/0002_events_gift_items.sql.
export async function startStripeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("organizer_stripe_accounts")
    .select("stripe_account_id")
    .eq("organizer_id", user.id)
    .maybeSingle();

  let stripeAccountId = existing?.stripe_account_id ?? null;

  if (!stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: user.email,
      // Les organisateurs Kdovie sont des particuliers, jamais des
      // entreprises — évite l'écran de choix "particulier / entreprise" et
      // les questions orientées entreprise de l'onboarding par défaut.
      business_type: "individual",
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
    });
    stripeAccountId = account.id;

    const { error } = await admin.from("organizer_stripe_accounts").insert({
      organizer_id: user.id,
      stripe_account_id: stripeAccountId,
    });

    if (error) {
      redirect("/compte/profil?erreur=stripe_compte");
    }
  }

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const returnUrl = `${protocol}://${host}/compte/profil`;

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  redirect(accountLink.url);
}
