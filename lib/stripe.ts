import Stripe from "stripe";

// Client Stripe côté serveur uniquement (clé secrète). Utilisé pour créer les comptes
// Connect Express des organisateurs, les sessions de paiement des invités, et gérer
// les webhooks (paiement reçu, compte vérifié, etc.)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-07-29.dahlia",
});
