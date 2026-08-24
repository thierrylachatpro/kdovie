import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
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

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";

  // URL publique à présenter à Stripe pour business_profile.url : la liste
  // de l'organisateur si elle existe déjà, sinon le site Kdovie — voir
  // CLAUDE.md > tâche #18.
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

  try {
    const stripeAccountId = await ensureOrganizerStripeAccount(user.id, user.email, businessUrl);

    const accountSession = await stripe.accountSessions.create({
      account: stripeAccountId,
      components: {
        account_onboarding: { enabled: true },
      },
    });

    return NextResponse.json({ client_secret: accountSession.client_secret });
  } catch {
    return NextResponse.json(
      { error: "Impossible de préparer la vérification Stripe." },
      { status: 500 },
    );
  }
}
