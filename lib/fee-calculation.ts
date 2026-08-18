// Calcul des frais de cotisation, voir CLAUDE.md > "Cagnotte et frais (tâche #18)".
// Partagé serveur (création du PaymentIntent) et client (aperçu en direct
// dans le formulaire de cotisation) — ne dépend d'aucune API Node/navigateur.

export type FeeMode = "frais_en_sus" | "frais_deduits";

const TAUX_STRIPE = 0.015;
const FRAIS_FIXE_STRIPE_CENTS = 25;
const TAUX_KDOVIE = 0.01;

// Montant réellement prélevé sur la carte de l'invité. En `frais_en_sus`,
// majoré pour que l'organisateur reçoive exactement `montantNetCents` net de
// frais Stripe + commission Kdovie (voir formule dans CLAUDE.md — une simple
// addition sous-facture légèrement l'organisateur). En `frais_deduits`,
// l'invité paie exactement le montant choisi.
export function computeMontantPreleveCents(montantNetCents: number, feeMode: FeeMode): number {
  if (feeMode === "frais_deduits") {
    return montantNetCents;
  }
  return Math.round((montantNetCents + FRAIS_FIXE_STRIPE_CENTS) / (1 - TAUX_STRIPE - TAUX_KDOVIE));
}

// Commission Kdovie (application_fee_amount Stripe), 1 % du montant
// réellement prélevé.
export function computeApplicationFeeAmountCents(montantPreleveCents: number): number {
  return Math.round(montantPreleveCents * TAUX_KDOVIE);
}

// Montant net que l'organisateur reçoit une fois les frais Stripe et la
// commission Kdovie déduits du montant prélevé.
export function computeMontantOrganisateurCents(montantPreleveCents: number): number {
  return Math.round(
    montantPreleveCents * (1 - TAUX_STRIPE - TAUX_KDOVIE) - FRAIS_FIXE_STRIPE_CENTS,
  );
}

// Part du montant prélevé correspondant aux frais bancaires Stripe (par
// différence avec la commission Kdovie et le montant organisateur, plutôt
// qu'un calcul indépendant, pour que les trois montants se recoupent
// exactement à l'euro près dans le détail affiché à l'invité).
export function computeFraisStripeCents(montantPreleveCents: number): number {
  return (
    montantPreleveCents -
    computeApplicationFeeAmountCents(montantPreleveCents) -
    computeMontantOrganisateurCents(montantPreleveCents)
  );
}
