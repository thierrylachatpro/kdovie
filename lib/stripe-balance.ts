import type Stripe from "stripe";

// Solde en euros (centimes) d'un compte connecté, séparé en "disponible"
// (virable maintenant) et "en attente" (paiements pas encore compensés par
// Stripe). Utilisé pour le reversement manuel par article et le cron de
// rappel des 90 jours — voir CLAUDE.md > "Reversement manuel de la cagnotte
// par article".
export function soldeEurCents(balance: Stripe.Balance): {
  disponible: number;
  enAttente: number;
} {
  const disponible = balance.available.find((b) => b.currency === "eur")?.amount ?? 0;
  const enAttente = balance.pending.find((b) => b.currency === "eur")?.amount ?? 0;
  return { disponible, enAttente };
}
