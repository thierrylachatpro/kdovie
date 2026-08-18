"use client";

import { useFormStatus } from "react-dom";
import { startStripeOnboarding } from "@/app/compte/profil/stripe-actions";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

export type StripeStatus = "non_connecte" | "en_attente" | "actif";

const STATUS_LABEL: Record<StripeStatus, string> = {
  non_connecte: "Non connecté",
  en_attente: "En attente de vérification",
  actif: "Actif",
};

const STATUS_CLASS: Record<StripeStatus, string> = {
  non_connecte: "bg-[#F2DFC9] text-[#8A7263]",
  en_attente: "bg-[#F5E3C9] text-[#7A5A16]",
  actif: "bg-[#DCE7DA] text-[#2F4A2C]",
};

const BUTTON_LABEL: Record<StripeStatus, string> = {
  non_connecte: "Activer les cagnottes",
  en_attente: "Continuer la vérification",
  actif: "Gérer mon compte Stripe",
};

function SubmitButton({ status }: { status: StripeStatus }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-heading inline-flex items-center gap-2.5 rounded-2xl bg-corail px-6 py-3.5 text-[16px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
    >
      {pending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
      {pending ? "Redirection…" : BUTTON_LABEL[status]}
    </button>
  );
}

export default function StripeStatusCard({ status }: { status: StripeStatus }) {
  return (
    <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-[#F7E7D6] p-6.5">
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
          {status === "non_connecte" &&
            "Pour recevoir l'argent de vos cagnottes directement et en toute sécurité, il vous faut un compte chez Stripe, notre partenaire de paiement. C'est rapide et gratuit."}
          {status === "en_attente" &&
            "Votre compte Stripe est créé, il ne reste qu'à confirmer votre identité — une formalité de sécurité de quelques minutes. En attendant, vos invités peuvent déjà cotiser normalement."}
          {status === "actif" &&
            "Tout est en ordre : l'argent de vos cagnottes arrive directement et en toute sécurité sur votre compte Stripe."}
        </p>
      </div>
      <form action={startStripeOnboarding}>
        <SubmitButton status={status} />
      </form>
    </section>
  );
}
