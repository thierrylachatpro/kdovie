"use client";

import { useState } from "react";
import { deleteEvent } from "@/app/compte/evenements/[slug]/event-actions";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

// Soft delete irréversible côté organisateur (seul un super-administrateur
// peut restaurer, voir CLAUDE.md > "Suppression d'une liste par
// l'organisateur") — confirmation en deux temps, même mécanique que la
// suppression d'un article dans GiftItemCard.
export default function SupprimerListeButton({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setErreur(null);
    setIsPending(true);
    const result = await deleteEvent(eventId, slug);
    setIsPending(false);
    if (result?.error) {
      setErreur(result.error);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[15px] font-semibold text-[#8A7263] underline hover:text-corail-dark"
      >
        Supprimer la liste
      </button>
    );
  }

  return (
    <div className="max-w-130 rounded-[18px] bg-[#F7D9C9] p-4.5">
      <p className="font-heading mb-1.5 text-[16px] font-bold text-[#A8431F]">
        Supprimer définitivement cette liste ?
      </p>
      <p className="mb-3.5 text-[15px] leading-relaxed text-[#8F3A1C]">
        Elle disparaîtra de votre tableau de bord et ne sera plus accessible à vos invités.
        Cette action est irréversible : vous ne pourrez pas la restaurer vous-même.
      </p>
      {erreur && <p className="mb-3 text-sm text-corail-dark">{erreur}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-5 py-3 text-[15px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
        >
          {isPending && <KdovieSpinner className="h-4 w-4" variant="dark" />}
          {isPending ? "Suppression…" : "Oui, supprimer définitivement"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="px-3 py-3 text-[15px] font-semibold text-[#8A7263]"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
