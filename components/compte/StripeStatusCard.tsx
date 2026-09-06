"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openStripeExpressDashboard } from "@/app/compte/profil/stripe-actions";
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

export default function StripeStatusCard({ status }: { status: OrganizerStripeStatus }) {
  const router = useRouter();
  const [onboardingOuvert, setOnboardingOuvert] = useState(false);
  const [dashboardPending, setDashboardPending] = useState(false);
  const [dashboardErreur, setDashboardErreur] = useState<string | null>(null);

  // Aucune redirection ici : l'organisateur ne quitte jamais la page tant
  // qu'il reste sur aucun/en_attente. Le statut Stripe n'est rafraîchi qu'à
  // la sortie du composant embarqué (router.refresh() relance le server
  // component et sa logique existante de poll payouts_enabled, inchangée).
  function handleExit() {
    setOnboardingOuvert(false);
    router.refresh();
  }

  // Ouvre le Dashboard Express dans un nouvel onglet. La fenêtre est ouverte
  // de façon synchrone dans le gestionnaire de clic (sinon les bloqueurs de
  // pop-up la refusent après le await), puis pointée vers l'URL du lien de
  // connexion une fois celui-ci émis côté serveur.
  async function handleOuvrirDashboard() {
    setDashboardErreur(null);
    setDashboardPending(true);
    const onglet = window.open("", "_blank", "noopener,noreferrer");
    const result = await openStripeExpressDashboard();
    setDashboardPending(false);
    if (result.error || !result.url) {
      onglet?.close();
      setDashboardErreur(result.error ?? "Impossible d'ouvrir votre compte Stripe.");
      return;
    }
    if (onglet) onglet.location.href = result.url;
    else window.open(result.url, "_blank", "noopener,noreferrer");
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
          {dashboardErreur && (
            <p className="mt-2 text-sm text-corail-dark">{dashboardErreur}</p>
          )}
        </div>

        {status === "actif" ? (
          <button
            type="button"
            onClick={handleOuvrirDashboard}
            disabled={dashboardPending}
            className="font-heading inline-flex items-center gap-2.5 rounded-2xl bg-corail px-6 py-3.5 text-[16px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
          >
            {dashboardPending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
            {dashboardPending ? "Ouverture…" : "Voir mon solde et mes versements"}
          </button>
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
