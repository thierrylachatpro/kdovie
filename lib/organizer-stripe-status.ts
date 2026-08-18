// Statut du compte Stripe Connect de l'organisateur, vu du côté invité sur
// /liste/[slug] — "aucun" (pas de compte créé, cotisation non proposée),
// "en_attente" (compte créé, KYC en cours, cotisation possible mais
// reversement différé), "actif" (payouts_enabled). Voir CLAUDE.md > tâche #18.
export type OrganizerStripeStatus = "aucun" | "en_attente" | "actif";
