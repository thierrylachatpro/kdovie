import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

// Vérifie/crée le compte Stripe Connect Express de l'organisateur — logique
// extraite de l'ancien startStripeOnboarding pour être partagée avec la
// nouvelle route d'Account Session (onboarding embarqué), voir CLAUDE.md >
// "Onboarding Stripe Connect embarqué, sans quitter Kdovie". Retourne un
// stripe_account_id garanti accessible côté Stripe (recrée le compte si
// l'ancien référencé en base est devenu inaccessible — supprimé côté
// Stripe, accès révoqué...).
export async function ensureOrganizerStripeAccount(
  userId: string,
  userEmail: string | undefined,
  businessUrl: string,
): Promise<string> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("organizer_stripe_accounts")
    .select("stripe_account_id")
    .eq("organizer_id", userId)
    .maybeSingle();

  let stripeAccountId = existing?.stripe_account_id ?? null;

  if (stripeAccountId) {
    try {
      await stripe.accounts.retrieve(stripeAccountId);
      return stripeAccountId;
    } catch {
      stripeAccountId = null;
    }
  }

  // Les organisateurs Kdovie sont des particuliers, jamais des entreprises —
  // évite l'écran de choix "particulier / entreprise" et les questions
  // orientées entreprise de l'onboarding par défaut. MCC 7299 "Services
  // divers" : catégorie générique et honnête pour une cotisation cadeau
  // entre particuliers — voir CLAUDE.md > tâche #18 pour le détail du choix
  // (8398 "Fundraising" écarté, implique un statut d'organisme caritatif).
  const account = await stripe.accounts.create({
    type: "express",
    country: "FR",
    email: userEmail,
    business_type: "individual",
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
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
      organizer_id: userId,
      stripe_account_id: stripeAccountId,
      payouts_enabled: false,
    },
    { onConflict: "organizer_id" },
  );

  if (error) {
    throw new Error("Impossible d'enregistrer le compte Stripe.");
  }

  return stripeAccountId;
}
