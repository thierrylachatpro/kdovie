import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Appelle confirm_contribution via le client service_role une fois le
// paiement confirmé par Stripe, voir CLAUDE.md > tâche #18, étape 5. La
// logique de verrouillage (statut cagnotte, incrément funded_amount_cents)
// vit exclusivement dans la fonction Postgres — jamais dupliquée ici.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Signature manquante", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signature invalide";
    return new Response(`Webhook invalide : ${message}`, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const admin = createAdminClient();

    const { data: contribution } = await admin
      .from("contributions")
      .select("id, status")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();

    if (contribution && contribution.status === "pending") {
      const { error } = await admin.rpc("confirm_contribution", {
        p_contribution_id: contribution.id,
      });
      if (error) {
        // Cas rare : l'article a été verrouillé en réservation directe par un
        // autre invité entre la création du PaymentIntent et la confirmation
        // du paiement. Le paiement Stripe a déjà eu lieu (fonds transférés à
        // l'organisateur) — on logue pour un traitement manuel plutôt que de
        // perdre l'information silencieusement.
        console.error(
          `confirm_contribution a échoué pour la contribution ${contribution.id} (PaymentIntent ${paymentIntent.id}) :`,
          error.message,
        );
      }
    }
  }

  return Response.json({ received: true });
}
