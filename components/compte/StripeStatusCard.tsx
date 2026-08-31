"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { startStripeOnboarding } from "@/app/compte/profil/stripe-actions";
import StripeEmbeddedOnboarding from "@/components/compte/StripeEmbeddedOnboarding";
import KdovieSpinner from "@/components/ui/KdovieSpinner";
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

// Statut "actif" uniquement — hors périmètre de l'onboarding embarqué, voir
// CLAUDE.md > "Onboarding Stripe Connect embarqué, sans quitter Kdovie".
function GererCompteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-heading inline-flex items-center gap-2.5 rounded-2xl bg-corail px-6 py-3.5 text-[16px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
    >
      {pending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
      {pending ? "Redirection…" : "Gérer mon compte Stripe"}
    </button>
  );
}

export default function StripeStatusCard({ status }: { status: OrganizerStripeStatus }) {
  const router = useRouter();
  const [onboardingOuvert, setOnboardingOuvert] = useState(false);

  // Aucune redirection ici : l'organisateur ne quitte jamais la page tant
  // qu'il reste sur aucun/en_attente. Le statut Stripe n'est rafraîchi qu'à
  // la sortie du composant embarqué (router.refresh() relance le server
  // component et sa logique existante de poll payouts_enabled, inchangée).
  function handleExit() {
    setOnboardingOuvert(false);
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
              "Tout est en ordre : l'argent de vos cagnottes arrive directement et en toute sécurité sur votre compte Stripe."}
          </p>
        </div>

        {status === "actif" ? (
          <form action={startStripeOnboarding}>
            <GererCompteButton />
          </form>
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

      {onboardingOuvert && status !== "actif" && <StripeEmbeddedOnboarding onExit={handleExit} />}
    </section>
  );
}
