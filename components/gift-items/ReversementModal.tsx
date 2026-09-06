"use client";

import { formatPriceCents } from "@/lib/gift-item";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

// Confirmation du reversement manuel d'une cagnotte, en modale (même
// habillage que ReservationModal / ContributionModal) — voir CLAUDE.md >
// "Reversement manuel de la cagnotte par article".
export default function ReversementModal({
  titre,
  montantAVirerCents,
  montantRestantCents,
  successMessage,
  isPending,
  erreur,
  onConfirm,
  onClose,
}: {
  titre: string;
  montantAVirerCents: number;
  montantRestantCents: number;
  successMessage: string | null;
  isPending: boolean;
  erreur: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const resteIndisponibleCents = montantRestantCents - montantAVirerCents;

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-[#4A3529]/45 sm:items-center sm:p-6"
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        className="w-full max-w-[460px] rounded-t-[28px] bg-creme p-6 pb-8 sm:rounded-[32px] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.25 w-11 rounded-full bg-[#F2DFC9] sm:hidden" />

        {successMessage ? (
          <>
            <h2 className="font-heading mb-2 text-2xl font-bold text-[#2F4A2C]">Virement lancé</h2>
            <p className="mb-6 text-base leading-relaxed text-[#5C4436]">{successMessage}</p>
            <button
              type="button"
              onClick={onClose}
              className="font-heading w-full rounded-2xl bg-sauge py-4 text-lg font-bold text-[#F7FBF6] hover:bg-[#79997A]"
            >
              Fermer
            </button>
          </>
        ) : (
          <>
            <h2 className="font-heading mb-1.5 text-2xl font-bold text-[#4A3529]">
              Me reverser cette cagnotte
            </h2>
            <p className="mb-5 text-base text-[#7A6354]">{titre}</p>

            {montantAVirerCents > 0 ? (
              <p className="mb-6 rounded-2xl bg-[#EEF3EC] px-4.5 py-4 text-[15px] leading-relaxed text-[#3E5A3A]">
                <strong>{formatPriceCents(montantAVirerCents)}</strong> vont être virés vers votre
                compte bancaire. Comptez environ 2 jours ouvrés.
                {resteIndisponibleCents > 0 && (
                  <>
                    {" "}
                    Le reste ({formatPriceCents(resteIndisponibleCents)}) n&apos;est pas encore
                    disponible : Stripe finalise les paiements les plus récents. Vous pourrez le
                    reverser dans quelques jours.
                  </>
                )}
              </p>
            ) : (
              <p className="mb-6 rounded-2xl bg-[#F5E3C9] px-4.5 py-4 text-[15px] leading-relaxed text-[#7A5A16]">
                Pas encore disponible au virement. Les cotisations peuvent mettre quelques jours
                avant d&apos;être validées par notre partenaire de paiement Stripe. Pour un tout
                premier virement, un délai de sécurité s&apos;ajoute d&apos;environ 1 à 2 semaines.
                Revenez un peu plus tard.
              </p>
            )}

            {erreur && <p className="mb-4 text-sm text-corail-dark">{erreur}</p>}

            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending || montantAVirerCents <= 0}
              className="font-heading inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sauge py-4 text-lg font-bold text-[#F7FBF6] hover:bg-[#79997A] disabled:opacity-60"
            >
              {isPending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
              {isPending ? "Virement en cours…" : "Confirmer le virement"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="mt-2 w-full py-2 text-[15px] font-semibold text-[#8A7263]"
            >
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}
