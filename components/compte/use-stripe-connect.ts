"use client";

import { useMemo } from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js";

// Instance Stripe Connect partagée par les composants embarqués (onboarding
// et gestion du compte) — même thème Kdovie, seul l'endpoint de session
// change selon les composants demandés. Voir CLAUDE.md > "Onboarding Stripe
// Connect embarqué, sans quitter Kdovie".
export function useStripeConnectInstance(sessionEndpoint: string) {
  return useMemo(
    () =>
      loadConnectAndInitialize({
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        fetchClientSecret: async () => {
          const response = await fetch(sessionEndpoint, { method: "POST" });
          if (!response.ok) {
            throw new Error("Impossible de préparer la connexion à Stripe.");
          }
          const { client_secret: clientSecret } = await response.json();
          return clientSecret;
        },
        // Palette Kdovie — liste complète des variables sur
        // docs.stripe.com/connect/embedded-appearance-options. Couleurs
        // reprises telles quelles du reste du produit (jamais de teinte
        // inventée).
        appearance: {
          overlays: "dialog",
          variables: {
            fontFamily: '"Work Sans", Arial, Helvetica, sans-serif',
            colorPrimary: "#E8734A",
            colorBackground: "#FFFFFF",
            colorText: "#4A3529",
            colorDanger: "#A8431F",
            buttonPrimaryColorBackground: "#E8734A",
            buttonPrimaryColorText: "#FFF8F0",
            buttonSecondaryColorBackground: "#F5E3C9",
            buttonSecondaryColorText: "#4A3529",
            buttonDangerColorBackground: "#A8431F",
            buttonDangerColorText: "#FFF8F0",
            badgeSuccessColorBackground: "#8BA888",
            badgeSuccessColorText: "#FFF8F0",
            badgeSuccessColorBorder: "#8BA888",
            badgeWarningColorBackground: "#F5B942",
            badgeWarningColorText: "#4A3529",
            badgeWarningColorBorder: "#F5B942",
            formBackgroundColor: "#FFFFFF",
            borderRadius: "14px",
            buttonBorderRadius: "14px",
            formBorderRadius: "12px",
            badgeBorderRadius: "999px",
          },
        },
        // Work Sans n'est pas une police système : sans cet ajout, le
        // fontFamily ci-dessus ne s'appliquerait pas dans l'iframe Stripe
        // (chargée depuis un domaine à part).
        fonts: [{ cssSrc: "https://fonts.googleapis.com/css?family=Work+Sans:400,600" }],
      }),
    [sessionEndpoint],
  );
}
