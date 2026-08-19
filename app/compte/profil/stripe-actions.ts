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

  // Le compte référencé en base peut être devenu inaccessible (supprimé
  // côté Stripe, accès révoqué...) — vérifié avant de s'en servir, sinon
  // accountLinks.create plus bas planterait. Dans ce cas on repart sur un
  // compte neuf, comme si l'organisateur n'en avait jamais eu.
  if (stripeAccountId) {
    try {
      await stripe.accounts.retrieve(stripeAccountId);
    } catch {
      stripeAccountId = null;
    }
  }

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";

  if (!stripeAccountId) {
    // URL publique à présenter à Stripe pour business_profile.url : la
    // liste de l'organisateur si elle existe déjà, sinon le site Kdovie —
    // un particulier n'a pas de site pro à fournir, voir CLAUDE.md > tâche #18.
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
      // Préremplit le profil d'activité (obligatoire côté Stripe même pour
      // un particulier) pour éviter que l'onboarding ne le redemande à
      // l'écran. MCC 7299 "Services divers" : catégorie générique et
      // honnête pour une cotisation cadeau entre particuliers — écarté
      // 8398 "Charitable and Social Service Organizations - Fundraising"
      // (le seul code lié au financement participatif dans la liste
      // Stripe) car il implique un statut d'organisme caritatif que les
      // organisateurs Kdovie n'ont pas, ce qui risquerait d'être signalé
      // comme incorrect par les contrôles de cohérence de Stripe. Même
      // code pour tous les comptes, l'activité étant identique pour tous
      // les organisateurs.
      business_profile: {
        mcc: "7299",
        url: businessUrl,
        product_description:
          "Cagnotte cadeau pour un événement personnel (naissance, mariage, anniversaire, etc.)",
      },
    });
    stripeAccountId = account.id;

    // upsert plutôt qu'insert : une ligne peut déjà exister pour cet
    // organizer_id (organizer_id est unique) si le compte précédent était
    // inaccessible — on la remplace plutôt que d'échouer sur le conflit.
    // payouts_enabled explicitement remis à false, le nouveau compte n'est
    // pas encore vérifié même si l'ancien l'était.
    const { error } = await admin.from("organizer_stripe_accounts").upsert(
      {
        organizer_id: user.id,
        stripe_account_id: stripeAccountId,
        payouts_enabled: false,
      },
      { onConflict: "organizer_id" },
    );

    if (error) {
      redirect("/compte/profil?erreur=stripe_compte");
    }
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
