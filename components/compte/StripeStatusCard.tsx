"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StripeEmbeddedOnboarding from "@/components/compte/StripeEmbeddedOnboarding";
import StripeEmbeddedGestion from "@/components/compte/StripeEmbeddedGestion";
import type { OrganizerStripeStatus } from "@/lib/organizer-stripe-status";

const STATUS_LABEL: Record<OrganizerStripeStatus, string> = {
  aucun: "Non connecté",
  en_attente: "En attente de vérification",
  actif: "Actif",
};

const STATUS_CLASS: Record<OrganizerStripeStatus, string> = {
  aucun: "bg-[#F2DFC9] text-[#8A7263]",
  en_attente: "bg-[#F5E3C9] text-[#7A5A16]",
  actif: "bg-[#DCE7DA] text-[#2F4A2C]",
};

export default function StripeStatusCard({ status }: { status: OrganizerStripeStatus }) {
  const router = useRouter();
  const [onboardingOuvert, setOnboardingOuvert] = useState(false);
  const [gestionOuverte, setGestionOuverte] = useState(false);

  // Aucune redirection nulle part : l'organisateur ne quitte jamais
  // kdovie.com, ni pour l'onboarding, ni pour consulter son solde / ses
  // versements. Le statut Stripe est relu au rechargement du server
  // component (router.refresh() relance sa logique de poll payouts_enabled).
  function fermerOnboarding() {
    setOnboardingOuvert(false);
    router.refresh();
  }

  function fermerGestion() {
    setGestionOuverte(false);
    router.refresh();
  }

  return (
    <section id="cagnotte" className="mt-5 scroll-mt-6 rounded-[28px] bg-[#F7E7D6] p-6.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-105">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="font-heading text-lg font-bold text-[#4A3529]">Ma cagnotte</span>
            <span
              className={`rounded-full px-3 py-1 text-[13px] font-semibold ${STATUS_CLASS[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed text-[#7A6354]">
            {status === "aucun" &&
              "Pour recevoir l'argent de vos cagnottes directement et en toute sécurité, il vous faut un compte chez Stripe, notre partenaire de paiement. C'est rapide et gratuit."}
            {status === "en_attente" &&
              "Votre compte Stripe est créé, il ne reste qu'à confirmer votre identité — une formalité de sécurité de quelques minutes. En attendant, vos invités peuvent déjà cotiser normalement."}
            {status === "actif" &&
              "Tout est en ordre : vous pouvez vous reverser l'argent de vos cagnottes quand vous le souhaitez, directement et en toute sécurité sur votre compte en banque, tant que votre compte Stripe reste correctement configuré (identité vérifiée, coordonnées bancaires à jour)."}
          </p>
        </div>

        {status === "actif" ? (
          !gestionOuverte && (
            <button
              type="button"
              onClick={() => setGestionOuverte(true)}
              className="font-heading inline-flex items-center gap-2.5 rounded-2xl bg-corail px-6 py-3.5 text-[16px] font-bold text-creme hover:bg-[#D45F37]"
            >
              Voir mon solde et mes versements
            </button>
          )
        ) : (
          !onboardingOuvert && (
            <button
              type="button"
              onClick={() => setOnboardingOuvert(true)}
              className="font-heading inline-flex items-center gap-2.5 rounded-2xl bg-corail px-6 py-3.5 text-[16px] font-bold text-creme hover:bg-[#D45F37]"
            >
              {status === "aucun" ? "Activer les cagnottes" : "Continuer la vérification"}
            </button>
          )
        )}
      </div>

      {onboardingOuvert && status !== "actif" && (
        <StripeEmbeddedOnboarding onExit={fermerOnboarding} />
      )}

      {gestionOuverte && status === "actif" && (
        <>
          <StripeEmbeddedGestion />
          <button
            type="button"
            onClick={fermerGestion}
            className="mt-3 text-[15px] font-semibold text-[#8A7263] hover:text-corail"
          >
            Fermer
          </button>
        </>
      )}
    </section>
  );
}
