import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site-url";
import { ensureOrganizerStripeAccount } from "@/lib/stripe-connect-account";

// Émet une Account Session pour le composant d'onboarding Stripe Connect
// embarqué (ConnectAccountOnboarding, components/compte/StripeEmbeddedOnboarding.tsx)
// — voir CLAUDE.md > "Onboarding Stripe Connect embarqué, sans quitter
// Kdovie". Ces sessions sont éphémères : c'est le composant embarqué
// lui-même qui rappelle cet endpoint automatiquement quand il a besoin d'un
// nouveau client_secret, pas géré manuellement côté Kdovie.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // URL publique à présenter à Stripe pour business_profile.url : la liste
  // de l'organisateur si elle existe déjà, sinon le site Kdovie — voir
  // CLAUDE.md > tâche #18. Toujours à partir de SITE_URL, jamais de
  // l'en-tête `host` de la requête : Stripe rejette `http://localhost:3000`
  // (`url_invalid`), ce qui cassait tout l'onboarding en local et sur
  // n'importe quel alias non canonique (incident du 6 septembre 2026).
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

  try {
    const stripeAccountId = await ensureOrganizerStripeAccount(user.id, user.email, businessUrl);

    const accountSession = await stripe.accountSessions.create({
      account: stripeAccountId,
      components: {
        account_onboarding: { enabled: true },
      },
    });

    return NextResponse.json({ client_secret: accountSession.client_secret });
  } catch (error) {
    // L'erreur Stripe réelle n'était jusqu'ici jamais loggée — le composant
    // embarqué affiche juste "Une erreur est survenue lors de
    // l'authentification", impossible à diagnostiquer sans ça. Voir
    // CLAUDE.md > "Onboarding Stripe Connect embarqué" > incident du
    // 6 septembre 2026.
    console.error("[account-session] échec:", error);
    return NextResponse.json(
      { error: "Impossible de préparer la vérification Stripe." },
      { status: 500 },
    );
  }
}
