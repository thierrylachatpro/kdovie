"use client";

import {
  ConnectComponentsProvider,
  ConnectPayouts,
  ConnectAccountManagement,
} from "@stripe/react-connect-js";
import { useStripeConnectInstance } from "@/components/compte/use-stripe-connect";

// Solde, historique des versements et coordonnées bancaires de l'organisateur
// affichés directement dans la carte "Ma cagnotte" (statut "actif") — jamais
// de redirection ni de nouvel onglet vers le Dashboard Express, l'organisateur
// ne quitte pas kdovie.com. Voir CLAUDE.md > "Onboarding Stripe Connect
// embarqué, sans quitter Kdovie".
export default function StripeEmbeddedGestion() {
  const stripeConnectInstance = useStripeConnectInstance("/api/stripe/account-session-gestion");

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-[28px] border-2 border-[#F2DFC9] bg-white p-6">
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectPayouts />
        <ConnectAccountManagement />
      </ConnectComponentsProvider>
    </div>
  );
}
