"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { formatPriceCents } from "@/lib/gift-item";
import {
  computeApplicationFeeAmountCents,
  computeFraisStripeCents,
  computeMontantOrganisateurCents,
  computeMontantPreleveCents,
  type FeeMode,
} from "@/lib/fee-calculation";
import { createContribution } from "@/app/liste/[slug]/contribution-actions";

// Chargé une seule fois au niveau du module — recréer le client Stripe à
// chaque rendu casserait le cache interne de Stripe.js.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const MONTANTS_SUGGERES = [10, 20, 50];

type GiftItemLite = {
  id: string;
  title: string;
  price_cents: number | null;
};

export default function ContributionModal({
  item,
  feeMode,
  cagnotteEnValidation,
  onClose,
}: {
  item: GiftItemLite;
  feeMode: FeeMode;
  cagnotteEnValidation: boolean;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"montant" | "paiement" | "merci">("montant");
  const [montant, setMontant] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [montantPreleveCents, setMontantPreleveCents] = useState(0);
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  const montantValue = parseFloat(montant.replace(",", "."));
  const montantNetCents = Number.isFinite(montantValue) ? Math.round(montantValue * 100) : 0;
  const montantValide = montantNetCents >= 100;
  const nomValide = nom.trim().length >= 2;

  const previewPreleveCents = montantValide
    ? computeMontantPreleveCents(montantNetCents, feeMode)
    : 0;
  const previewOrganisateurCents = montantValide
    ? computeMontantOrganisateurCents(previewPreleveCents)
    : 0;
  const previewFraisStripeCents = montantValide ? computeFraisStripeCents(previewPreleveCents) : 0;
  const previewCommissionKdovieCents = montantValide
    ? computeApplicationFeeAmountCents(previewPreleveCents)
    : 0;

  async function handleSubmitMontant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!montantValide || !nomValide) {
      setTouched(true);
      return;
    }
    setErreur(null);
    setIsPending(true);
    const result = await createContribution(item.id, nom, email, montantNetCents);
    setIsPending(false);
    if (result.error || !result.clientSecret) {
      setErreur(result.error ?? "Impossible de préparer la cotisation, réessayez.");
      return;
    }
    setClientSecret(result.clientSecret);
    setMontantPreleveCents(result.montantPreleveCents ?? montantNetCents);
    setPhase("paiement");
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-[#4A3529]/45 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-[32px] bg-creme p-8.5"
        onClick={(event) => event.stopPropagation()}
      >
        {phase === "montant" && (
          <div>
            <div className="mb-1.5 flex items-start justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold text-[#C0512A]">
                Je cotise pour ce cadeau
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[15px] font-semibold text-[#8A7263]"
              >
                Fermer
              </button>
            </div>
            <p className="mb-5.5 text-base text-[#7A6354]">
              {item.title} · {formatPriceCents(item.price_cents)}
            </p>

            {cagnotteEnValidation && (
              <p className="mb-4 rounded-2xl bg-[#F5E3C9] px-4 py-3 text-sm text-[#7A5A16]">
                Cagnotte en validation : votre cotisation est prise en compte normalement, le
                reversement à l&apos;organisateur est simplement différé le temps que Stripe
                termine de vérifier son compte.
              </p>
            )}

            <form onSubmit={handleSubmitMontant} className="flex flex-col gap-4.5">
              <label className="flex flex-col gap-2">
                <span className="font-heading text-base font-bold text-[#4A3529]">
                  Montant de votre cotisation
                </span>
                <div className="flex flex-wrap gap-2">
                  {MONTANTS_SUGGERES.map((value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setMontant(String(value))}
                      className={`rounded-full px-4 py-2 text-[15px] font-semibold ${
                        montant === String(value)
                          ? "bg-corail text-creme"
                          : "bg-[#F2DFC9] text-[#5C4436]"
                      }`}
                    >
                      {value} €
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={montant}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setMontant(event.target.value)}
                  placeholder="Autre montant, en euros"
                  className={`w-full rounded-[18px] border-2 bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune ${
                    touched && !montantValide ? "border-corail" : "border-[#F2DFC9]"
                  }`}
                />
                {touched && !montantValide && (
                  <span className="text-sm text-corail-dark">
                    Indiquez un montant d&apos;au moins 1 €.
                  </span>
                )}
              </label>

              {montantValide && (
                <div className="rounded-2xl bg-[#F7E7D6] px-4.5 py-4 text-[15px] leading-relaxed text-[#5C4436]">
                  {feeMode === "frais_en_sus" ? (
                    <>
                      {formatPriceCents(montantNetCents)} pour le cadeau +{" "}
                      {formatPriceCents(previewPreleveCents - montantNetCents)} de frais ={" "}
                      <strong>{formatPriceCents(previewPreleveCents)} prélevés</strong>
                    </>
                  ) : (
                    <>
                      <strong>{formatPriceCents(previewPreleveCents)} prélevés</strong>,
                      l&apos;organisateur recevra environ{" "}
                      {formatPriceCents(previewOrganisateurCents)} une fois les frais déduits.
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setDetailsOuverts((current) => !current)}
                    className="mt-2 block text-sm font-semibold text-corail underline"
                  >
                    {detailsOuverts ? "Masquer le détail" : "Détails"}
                  </button>

                  {detailsOuverts && (
                    <table className="mt-3 w-full border-collapse text-sm">
                      <tbody>
                        {feeMode === "frais_en_sus" ? (
                          <>
                            <tr>
                              <td className="border-t border-[#F2DFC9] py-1.5">
                                Montant cotisé (net pour l&apos;organisateur)
                              </td>
                              <td className="border-t border-[#F2DFC9] py-1.5 text-right">
                                {formatPriceCents(montantNetCents)}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5">+ Frais bancaires (Stripe)</td>
                              <td className="py-1.5 text-right">
                                {formatPriceCents(previewFraisStripeCents)}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5">+ Frais de traitement Kdovie (1 %)</td>
                              <td className="py-1.5 text-right">
                                {formatPriceCents(previewCommissionKdovieCents)}
                              </td>
                            </tr>
                            <tr>
                              <td className="border-t border-[#F2DFC9] py-1.5 font-semibold">
                                = Total prélevé sur votre carte
                              </td>
                              <td className="border-t border-[#F2DFC9] py-1.5 text-right font-semibold">
                                {formatPriceCents(previewPreleveCents)}
                              </td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr>
                              <td className="border-t border-[#F2DFC9] py-1.5">
                                Montant prélevé sur votre carte
                              </td>
                              <td className="border-t border-[#F2DFC9] py-1.5 text-right">
                                {formatPriceCents(previewPreleveCents)}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5">− Frais bancaires (Stripe)</td>
                              <td className="py-1.5 text-right">
                                {formatPriceCents(previewFraisStripeCents)}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5">− Frais de traitement Kdovie (1 %)</td>
                              <td className="py-1.5 text-right">
                                {formatPriceCents(previewCommissionKdovieCents)}
                              </td>
                            </tr>
                            <tr>
                              <td className="border-t border-[#F2DFC9] py-1.5 font-semibold">
                                = Reçu par l&apos;organisateur
                              </td>
                              <td className="border-t border-[#F2DFC9] py-1.5 text-right font-semibold">
                                {formatPriceCents(previewOrganisateurCents)}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              <label className="flex flex-col gap-2">
                <span className="font-heading text-base font-bold text-[#4A3529]">
                  Prénom et nom
                </span>
                <input
                  type="text"
                  value={nom}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => setNom(event.target.value)}
                  placeholder="Sophie Martin"
                  className={`w-full rounded-[18px] border-2 bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune ${
                    touched && !nomValide ? "border-corail" : "border-[#F2DFC9]"
                  }`}
                />
                {touched && !nomValide && (
                  <span className="text-sm text-corail-dark">
                    Indiquez votre prénom et votre nom.
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-2">
                <span className="font-heading text-base font-bold text-[#4A3529]">
                  E-mail{" "}
                  <span className="text-sm font-medium text-[#8A7263]">— facultatif</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="sophie@email.fr"
                  className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
                />
              </label>

              {erreur && <p className="text-sm text-corail-dark">{erreur}</p>}

              <button
                type="submit"
                disabled={isPending}
                className="font-heading w-full rounded-2xl bg-corail py-4.5 text-lg font-bold text-creme disabled:opacity-60"
              >
                {isPending ? "Préparation…" : "Continuer vers le paiement"}
              </button>
            </form>
          </div>
        )}

        {phase === "paiement" && clientSecret && (
          <div>
            <div className="mb-1.5 flex items-start justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold text-[#C0512A]">Paiement</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[15px] font-semibold text-[#8A7263]"
              >
                Fermer
              </button>
            </div>
            <p className="mb-5.5 text-base text-[#7A6354]">
              {item.title} · {formatPriceCents(montantPreleveCents)} à régler
            </p>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                montantPreleveCents={montantPreleveCents}
                onSuccess={() => setPhase("merci")}
              />
            </Elements>
          </div>
        )}

        {phase === "merci" && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#DCE7DA] text-[28px]">
              🎁
            </div>
            <h2 className="font-heading mb-2.5 text-2xl font-bold text-[#2F4A2C]">
              Merci pour votre cotisation !
            </h2>
            <p className="mb-6 text-base leading-relaxed text-[#5C4436]">
              Votre participation à « {item.title} » a bien été prise en compte.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="font-heading rounded-2xl bg-corail px-6.5 py-4 text-base font-bold text-creme"
            >
              Revenir à la liste
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentForm({
  montantPreleveCents,
  onSuccess,
}: {
  montantPreleveCents: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setIsPending(true);
    setErreur(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}`,
      },
      redirect: "if_required",
    });
    setIsPending(false);
    if (error) {
      setErreur(error.message ?? "Le paiement n'a pas pu être confirmé.");
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
      <PaymentElement />
      {erreur && <p className="text-sm text-corail-dark">{erreur}</p>}
      <button
        type="submit"
        disabled={!stripe || isPending}
        className="font-heading w-full rounded-2xl bg-corail py-4.5 text-lg font-bold text-creme disabled:opacity-60"
      >
        {isPending ? "Paiement en cours…" : `Payer ${formatPriceCents(montantPreleveCents)}`}
      </button>
    </form>
  );
}
