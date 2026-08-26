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
        // Palette Kdovie — liste complète des variables disponibles sur
        // docs.stripe.com/connect/embedded-appearance-options. Couleurs
        // reprises telles quelles du reste du produit (jamais de teinte
        // inventée) : sauge/crème pour les badges "succès" (même code que
        // le badge "Actif" de StripeStatusCard), jaune/texte pour "en
        // attente", #A8431F déjà utilisé ailleurs (MaintenanceToggle) pour
        // les états d'erreur/destructifs.
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
        // (chargée depuis un domaine à part, sans accès aux polices déjà
        // injectées par next/font sur kdovie.com).
        fonts: [{ cssSrc: "https://fonts.googleapis.com/css?family=Work+Sans:400,600" }],
      }),
    [],
  );

  return (
    <div className="mt-4 rounded-[28px] border-2 border-[#F2DFC9] bg-white p-6">
      <p className="mb-3.5 text-[13px] leading-relaxed text-[#8A7263]">
        Vérification sécurisée gérée directement par <strong>Stripe</strong>, notre partenaire de
        paiement — vos informations ne transitent jamais par les serveurs de Kdovie.
      </p>
      <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
        <ConnectAccountOnboarding onExit={onExit} />
      </ConnectComponentsProvider>
    </div>
  );
}
