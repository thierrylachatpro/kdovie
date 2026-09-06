import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site-url";
import { ensureOrganizerStripeAccount } from "@/lib/stripe-connect-account";

// Émet une Account Session Stripe Connect pour les composants embarqués
// (onboarding, ou solde/versements/coordonnées bancaires) — voir CLAUDE.md >
// "Onboarding Stripe Connect embarqué, sans quitter Kdovie". Le jeu de
// `components` diffère selon l'appelant, le reste (session, compte connecté,
// URL publique) est commun.
export async function emettreAccountSession(
  components: Stripe.AccountSessionCreateParams.Components,
): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // business_profile.url : la liste de l'organisateur si elle existe déjà,
  // sinon le site Kdovie — toujours à partir de SITE_URL, jamais de
  // l'en-tête `host` (Stripe rejette `http://localhost:3000`, incident du
  // 6 septembre 2026).
  const { data: firstEvent } = await supabase
    .from("events")
    .select("slug")
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const businessUrl = firstEvent ? `${SITE_URL}/liste/${firstEvent.slug}` : SITE_URL;

  try {
    const stripeAccountId = await ensureOrganizerStripeAccount(user.id, user.email, businessUrl);
    const accountSession = await stripe.accountSessions.create({
      account: stripeAccountId,
      components,
    });
    return NextResponse.json({ client_secret: accountSession.client_secret });
  } catch (error) {
    // L'erreur Stripe réelle n'était jusqu'ici jamais loggée — le composant
    // embarqué affiche juste "Une erreur est survenue lors de
    // l'authentification", impossible à diagnostiquer sans ça.
    console.error("[account-session] échec:", error);
    return NextResponse.json(
      { error: "Impossible de préparer la vérification Stripe." },
      { status: 500 },
    );
  }
}
