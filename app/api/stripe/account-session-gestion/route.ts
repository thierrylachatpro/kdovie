import { emettreAccountSession } from "@/lib/stripe-account-session";

// Session pour les composants embarqués de gestion du compte (statut
// "actif") — solde + historique des versements (ConnectPayouts) et
// coordonnées bancaires / informations (ConnectAccountManagement), affichés
// directement dans la carte "Ma cagnotte", voir
// components/compte/StripeEmbeddedGestion.tsx.
//
// standard_payouts / instant_payouts désactivés : les virements se
// déclenchent uniquement article par article depuis la page de gestion de
// liste (voir CLAUDE.md > "Reversement manuel de la cagnotte par article"),
// jamais via un bouton générique qui casserait la comptabilité par cadeau.
// edit_payout_schedule désactivé : le mode "manuel" est global au produit,
// pas un réglage laissé à l'organisateur.
export async function POST() {
  return emettreAccountSession({
    payouts: {
      enabled: true,
      features: {
        disable_stripe_user_authentication: false,
        edit_payout_schedule: false,
        external_account_collection: true,
        instant_payouts: false,
        standard_payouts: false,
      },
    },
    account_management: {
      enabled: true,
      features: {
        disable_stripe_user_authentication: false,
        external_account_collection: true,
      },
    },
  });
}
