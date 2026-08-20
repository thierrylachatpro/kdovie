"use client";

import { useState, useTransition } from "react";
import { updateOrganizerPseudo, setOrganizerDisabled } from "@/app/admin/organisateurs/actions";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

export default function OrganisateurCard({
  userId,
  email,
  pseudo,
  createdAt,
  lastSignInAt,
  disabled,
  isAdmin,
}: {
  userId: string;
  email: string;
  pseudo: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  disabled: boolean;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pseudo ?? "");
  const [current, setCurrent] = useState(pseudo);
  const [currentDisabled, setCurrentDisabled] = useState(disabled);
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dateFormatee = new Date(createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const derniereConnexionFormatee = lastSignInAt
    ? new Date(lastSignInAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "jamais";

  function handleSavePseudo() {
    setErreur(null);
    startTransition(async () => {
      const result = await updateOrganizerPseudo(userId, draft);
      if (result.error) {
        setErreur(result.error);
        return;
      }
      setCurrent(draft.trim() || null);
      setEditing(false);
    });
  }

  function handleToggleDisabled() {
    setErreur(null);
    startTransition(async () => {
      const result = await setOrganizerDisabled(userId, !currentDisabled);
      if (result.error) {
        setErreur(result.error);
        return;
      }
      setCurrentDisabled(!currentDisabled);
      setConfirmingDisable(false);
    });
  }

  return (
    <div className="rounded-2xl border-2 border-[#F2DFC9] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-heading text-lg font-bold text-[#4A3529]">
              {current || "Sans pseudo"}
            </span>
            {isAdmin && (
              <span className="rounded-full bg-jaune/25 px-2.5 py-1 text-[12px] font-semibold text-[#7A5A16]">
                Admin
              </span>
            )}
            {currentDisabled && (
              <span className="rounded-full bg-[#F7D9C9] px-2.5 py-1 text-[12px] font-semibold text-[#A8431F]">
                Désactivé
              </span>
            )}
          </div>
          <div className="text-sm text-[#8A7263]">
            {email} · inscrit le {dateFormatee} · dernière connexion : {derniereConnexionFormatee}
          </div>
        </div>

        <div className="flex flex-none flex-wrap items-center gap-2.5">
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(current ?? "");
                setEditing(true);
              }}
              className="rounded-2xl bg-[#F7E7D6] px-4 py-2.5 text-[14px] font-semibold text-[#5C4436] hover:bg-[#F2DFC9]"
            >
              Modifier le pseudo
            </button>
          )}
          {!confirmingDisable ? (
            <button
              type="button"
              onClick={() => setConfirmingDisable(true)}
              className={`rounded-2xl px-4 py-2.5 text-[14px] font-semibold ${
                currentDisabled
                  ? "bg-sauge/20 text-sauge-dark hover:bg-sauge/30"
                  : "bg-[#F7D9C9] text-[#A8431F] hover:bg-[#F2C6AE]"
              }`}
            >
              {currentDisabled ? "Réactiver" : "Désactiver"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8A7263]">Confirmer ?</span>
              <button
                type="button"
                onClick={handleToggleDisabled}
                disabled={isPending}
                className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-4 py-2.5 text-[14px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
              >
                {isPending && <KdovieSpinner className="h-3.5 w-3.5" variant="dark" />}
                Oui
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDisable(false)}
                disabled={isPending}
                className="text-sm font-semibold text-[#8A7263]"
              >
                Annuler
              </button>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-[#F2DFC9] pt-4">
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Pseudo"
            className="min-w-50 flex-1 rounded-2xl border-2 border-[#F2DFC9] bg-white px-4 py-2.5 text-[15px] text-[#4A3529] outline-none focus:border-corail"
          />
          <button
            type="button"
            onClick={handleSavePseudo}
            disabled={isPending}
            className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-4 py-2.5 text-[14px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
          >
            {isPending && <KdovieSpinner className="h-3.5 w-3.5" variant="dark" />}
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={isPending}
            className="text-sm font-semibold text-[#8A7263]"
          >
            Annuler
          </button>
        </div>
      )}
      {erreur && <p className="mt-2 text-sm text-corail-dark">{erreur}</p>}
    </div>
  );
}
