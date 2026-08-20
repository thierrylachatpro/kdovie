// Statut du compte Stripe Connect de l'organisateur — "aucun" (pas de
// compte créé), "en_attente" (compte créé, KYC en cours, cotisation
// possible mais reversement différé), "actif" (payouts_enabled). Calcul
// partagé entre /liste/[slug] (côté invité), /compte/profil (bloc "Ma
// cagnotte") et /compte (bandeau d'incitation) — voir CLAUDE.md > "Bandeau
// d'incitation à activer sa cagnotte Stripe sur /compte".
export type OrganizerStripeStatus = "aucun" | "en_attente" | "actif";

export function deriveOrganizerStripeStatus(
  account: { payouts_enabled: boolean } | null,
): OrganizerStripeStatus {
  if (!account) return "aucun";
  return account.payouts_enabled ? "actif" : "en_attente";
}
