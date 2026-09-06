"use client";

import { ConnectComponentsProvider, ConnectAccountOnboarding } from "@stripe/react-connect-js";
import { useStripeConnectInstance } from "@/components/compte/use-stripe-connect";

// Formulaire de vérification Stripe intégré directement dans la carte "Ma
// cagnotte" (jamais de redirection hors de kdovie.com) — voir CLAUDE.md >
// "Onboarding Stripe Connect embarqué, sans quitter Kdovie". fetchClientSecret
// est rappelé automatiquement par le composant lui-même quand il a besoin
// d'un nouveau secret (session éphémère), pas à gérer manuellement ici.
export default function StripeEmbeddedOnboarding({ onExit }: { onExit: () => void }) {
  const stripeConnectInstance = useStripeConnectInstance("/api/stripe/account-session");

  return (
    <div className="mt-4 rounded-[28px] border-2 border-[#F2DFC9] bg-white p-6">
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectAccountOnboarding onExit={onExit} />
      </ConnectComponentsProvider>
    </div>
  );
}
