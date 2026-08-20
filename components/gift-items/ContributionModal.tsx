"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { formatPriceCents } from "@/lib/gift-item";
import {
  computeApplicationFeeAmountCents,
  computeFraisStripeCents,
  computeMontantOrganisateurCents,
  computeMontantPreleveCents,
  type FeeMode,
} from "@/lib/fee-calculation";
import { createContribution } from "@/app/liste/[slug]/contribution-actions";

const MONTANTS_SUGGERES = [10, 20, 50];

type GiftItemLite = {
  id: string;
  title: string;
  price_cents: number | null;
};

export default function ContributionModal({
  item,
  slug,
  feeMode,
  cagnotteEnValidation,
  onClose,
}: {
  item: GiftItemLite;
  slug: string;
  feeMode: FeeMode;
  cagnotteEnValidation: boolean;
  onClose: () => void;
}) {
  const [montant, setMontant] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  const montantValue = parseFloat(montant.replace(",", "."));
  const montantNetCents = Number.isFinite(montantValue) ? Math.round(montantValue * 100) : 0;
  const montantValide = montantNetCents >= 100;

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
    if (!montantValide) {
      setTouched(true);
      return;
    }
    setErreur(null);
    setIsPending(true);
    const result = await createContribution(item.id, slug, nom, email, montantNetCents);
    if (result.error || !result.checkoutUrl) {
      setIsPending(false);
      setErreur(result.error ?? "Impossible de préparer la cotisation, réessayez.");
      return;
    }
    // Redirige vers la page de paiement hébergée par Stripe (Checkout) —
    // l'invité ne saisit jamais sa carte sur kdovie.com, voir CLAUDE.md >
    // tâche #18.
    window.location.assign(result.checkoutUrl);
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-[#4A3529]/45 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-t-[28px] bg-creme p-6 pb-8 sm:rounded-[32px] sm:p-8.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.25 w-11 rounded-full bg-[#F2DFC9] sm:hidden" />
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
                            <td className="py-1.5">+ Frais de traitement Kdovie</td>
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
                            <td className="py-1.5">− Frais de traitement Kdovie</td>
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
                Prénom et nom{" "}
                <span className="text-sm font-medium text-[#8A7263]">— facultatif</span>
              </span>
              <input
                type="text"
                value={nom}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setNom(event.target.value)}
                placeholder="Sophie Martin"
                className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
              />
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
              {isPending ? "Redirection vers le paiement…" : "Continuer vers le paiement"}
            </button>
            <span className="text-center text-sm text-[#8A7263]">
              Vous serez redirigé vers la page de paiement sécurisée de Stripe — votre numéro de
              carte n&apos;est jamais saisi sur Kdovie.
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}
