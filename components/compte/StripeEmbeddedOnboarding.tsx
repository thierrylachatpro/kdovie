"use client";

import { useMemo } from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import { ConnectComponentsProvider, ConnectAccountOnboarding } from "@stripe/react-connect-js";

// Formulaire de vérification Stripe intégré directement dans la carte "Ma
// cagnotte" (jamais de redirection hors de kdovie.com) — voir CLAUDE.md >
// "Onboarding Stripe Connect embarqué, sans quitter Kdovie". fetchClientSecret
// est rappelé automatiquement par le composant lui-même quand il a besoin
// d'un nouveau secret (session éphémère), pas à gérer manuellement ici.
export default function StripeEmbeddedOnboarding({ onExit }: { onExit: () => void }) {
  const stripeConnectInstance = useMemo(
    () =>
      loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        fetchClientSecret: async () => {
          const response = await fetch("/api/stripe/account-session", { method: "POST" });
          if (!response.ok) {
            throw new Error("Impossible de préparer la vérification Stripe.");
          }
          const { client_secret: clientSecret } = await response.json();
          return clientSecret;
        },
        // Palette Kdovie — couleurs des composants Connect, voir
        // docs.stripe.com/connect/embedded-appearance-options. La police et
        // le fond général sont hérités du conteneur HTML parent par défaut,
        // pas besoin de les fixer ici.
        appearance: {
          overlays: "dialog",
          variables: {
            colorPrimary: "#E8734A",
            colorText: "#4A3529",
            buttonPrimaryColorBackground: "#E8734A",
            buttonPrimaryColorText: "#FFF8F0",
            borderRadius: "14px",
          },
        },
      }),
    [],
  );

  return (
    <div className="mt-4 rounded-2xl bg-white p-4">
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectAccountOnboarding onExit={onExit} />
      </ConnectComponentsProvider>
    </div>
  );
}
