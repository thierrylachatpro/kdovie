"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateEventStatusAdmin, deleteEventPermanently } from "@/app/admin/listes/actions";
import { restoreEvent } from "@/app/admin/actions";
import { eventStatusLabel, eventStatusClassName, type EventStatus } from "@/lib/event-status";
import { formatPriceCents } from "@/lib/gift-item";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

export default function ListeAdminCard({
  liste,
}: {
  liste: {
    id: string;
    name: string;
    slug: string;
    status: string;
    deleted_at: string | null;
    created_at: string;
    organizerEmail: string;
    organizerPseudo: string | null;
    montantCotiseCents: number;
  };
}) {
  const [status, setStatus] = useState(liste.status);
  const [supprimee, setSupprimee] = useState(Boolean(liste.deleted_at));
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [nomSaisi, setNomSaisi] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dateFormatee = new Date(liste.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleToggleStatus() {
    const next: EventStatus = status === "ouverte" ? "brouillon" : "ouverte";
    setErreur(null);
    startTransition(async () => {
      const result = await updateEventStatusAdmin(liste.id, next);
      if (result.error) {
        setErreur(result.error);
        return;
      }
      setStatus(next);
    });
  }

  function handleRestore() {
    setErreur(null);
    startTransition(async () => {
      const result = await restoreEvent(liste.id);
      if (result.error) {
        setErreur(result.error);
        return;
      }
      setSupprimee(false);
    });
  }

  function handleDelete() {
    setErreur(null);
    startTransition(async () => {
      const result = await deleteEventPermanently(liste.id, nomSaisi);
      if (result.error) {
        setErreur(result.error);
      }
      // En cas de succès, la liste disparaît de la page au prochain
      // revalidate — pas besoin de gérer un état local "supprimée pour de
      // vrai", contrairement à supprimee (soft delete) ci-dessus.
    });
  }

  return (
    <div className="rounded-2xl border-2 border-[#F2DFC9] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-heading text-lg font-bold text-[#4A3529]">{liste.name}</span>
            {supprimee ? (
              <span className="rounded-full bg-gris/20 px-2.5 py-1 text-[12px] font-semibold text-[#6B6B63]">
                Supprimée
              </span>
            ) : (
              <span
                className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${eventStatusClassName(status)}`}
              >
                {eventStatusLabel(status)}
              </span>
            )}
          </div>
          <div className="text-sm text-[#8A7263]">
            /liste/{liste.slug} · organisateur : {liste.organizerPseudo ?? liste.organizerEmail} (
            {liste.organizerEmail}) · créée le {dateFormatee}
            {liste.montantCotiseCents > 0 && (
              <> · {formatPriceCents(liste.montantCotiseCents)} cotisés</>
            )}
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          <Link
            href={`/liste/${liste.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-[#F7E7D6] px-4 py-2.5 text-[14px] font-semibold text-[#5C4436] hover:bg-[#F2DFC9]"
          >
            Voir la liste
          </Link>

          {supprimee ? (
            <button
              type="button"
              onClick={handleRestore}
              disabled={isPending}
              className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-4 py-2.5 text-[14px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
            >
              {isPending && <KdovieSpinner className="h-3.5 w-3.5" variant="dark" />}
              Restaurer
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isPending}
                className="rounded-2xl bg-[#F7E7D6] px-4 py-2.5 text-[14px] font-semibold text-[#5C4436] hover:bg-[#F2DFC9] disabled:opacity-60"
              >
                {status === "ouverte" ? "Repasser en brouillon" : "Ouvrir aux invités"}
              </button>
              {!confirmingDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="rounded-2xl bg-[#F7D9C9] px-4 py-2.5 text-[14px] font-semibold text-[#A8431F] hover:bg-[#F2C6AE]"
                >
                  Supprimer définitivement
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {confirmingDelete && (
        <div className="mt-4 rounded-[18px] bg-[#F7D9C9] p-4.5">
          <p className="font-heading mb-1.5 text-[16px] font-bold text-[#A8431F]">
            Supprimer définitivement « {liste.name} » ?
          </p>
          <p className="mb-2 text-[15px] leading-relaxed text-[#8F3A1C]">
            Action irréversible : la liste et tous ses cadeaux, réservations et cotisations seront
            effacés de la base, y compris leur trace comptable.
          </p>
          {liste.montantCotiseCents > 0 && (
            <p className="mb-3 text-[15px] font-semibold text-[#8F3A1C]">
              Cette liste a reçu {formatPriceCents(liste.montantCotiseCents)} de cotisations
              réelles — la suppression effacera aussi cette trace comptable.
            </p>
          )}
          <label className="mb-3 block text-[14px] font-semibold text-[#8F3A1C]">
            Tapez le nom exact de la liste pour confirmer :
            <input
              type="text"
              value={nomSaisi}
              onChange={(event) => setNomSaisi(event.target.value)}
              placeholder={liste.name}
              className="mt-1.5 block w-full max-w-90 rounded-xl border-2 border-[#F2C6AE] bg-white px-3.5 py-2.5 text-[15px] text-[#4A3529] outline-none focus:border-corail"
            />
          </label>
          {erreur && <p className="mb-3 text-sm text-corail-dark">{erreur}</p>}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || nomSaisi.trim() !== liste.name}
              className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-5 py-3 text-[15px] font-bold text-creme disabled:opacity-40"
            >
              {isPending && <KdovieSpinner className="h-4 w-4" variant="dark" />}
              Oui, supprimer définitivement
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingDelete(false);
                setNomSaisi("");
                setErreur(null);
              }}
              disabled={isPending}
              className="px-3 py-3 text-[15px] font-semibold text-[#8A7263]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      {!confirmingDelete && erreur && <p className="mt-2 text-sm text-corail-dark">{erreur}</p>}
    </div>
  );
}
