"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateDisplayName } from "@/app/compte/profil/actions";
import { initiales } from "@/lib/initials";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

export default function PseudoCard({
  email,
  initialPseudo,
  fallbackDisplayName,
  dateCreation,
}: {
  email: string;
  initialPseudo: string;
  fallbackDisplayName: string;
  dateCreation: string | null;
}) {
  const [committed, setCommitted] = useState(initialPseudo);
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const value = draft ?? committed;
  const trimmed = value.trim();
  const dirty = value !== committed;
  const tooShort = trimmed.length > 0 && trimmed.length < 3;
  const empty = trimmed.length === 0;
  const invalid = tooShort || empty;
  const canSave = dirty && !invalid && !isPending;

  const nomAffiche = trimmed || fallbackDisplayName;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setDraft(event.target.value);
    setSaved(false);
    setErreur(null);
  }

  function handleSave() {
    if (!canSave) return;
    startTransition(async () => {
      const result = await updateDisplayName(trimmed);
      if (result.error) {
        setErreur(result.error);
        return;
      }
      setCommitted(trimmed);
      setDraft(null);
      setSaved(true);
    });
  }

  function handleCancel() {
    setDraft(null);
    setSaved(false);
    setErreur(null);
  }

  const hint = empty
    ? "Choisissez un pseudo, il apparaît sur vos listes."
    : tooShort
      ? "Trois caractères minimum."
      : "Visible par vos invités sur chacune de vos listes.";

  return (
    <section className="rounded-[28px] border-2 border-[#F2DFC9] bg-white p-7.5">
      <div className="mb-7 flex items-center gap-4.5">
        <span className="font-heading flex h-16 w-16 flex-none items-center justify-center rounded-[22px] bg-corail text-2xl font-bold text-creme">
          {initiales(nomAffiche)}
        </span>
        <div>
          <div className="font-heading text-[22px] font-bold text-[#4A3529]">{nomAffiche}</div>
          {dateCreation && (
            <div className="text-[15px] text-[#8A7263]">Compte créé en {dateCreation}</div>
          )}
        </div>
      </div>

      <div className="mb-6.5 flex flex-col gap-2">
        <span className="font-heading text-base font-bold text-[#4A3529]">Adresse e-mail</span>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4">
          <span className="text-[17px] text-[#5C4436]">{email}</span>
          <span className="rounded-full bg-[#DCE7DA] px-3 py-1.5 text-[13px] font-semibold text-[#2F4A2C]">
            Sert à vous connecter
          </span>
        </div>
        <span className="text-sm text-[#8A7263]">
          Elle ne peut pas être modifiée pour l&apos;instant. Écrivez-nous si vous devez en
          changer.
        </span>
      </div>

      <label className="mb-6 flex flex-col gap-2">
        <span className="font-heading text-base font-bold text-[#4A3529]">Pseudo</span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          maxLength={24}
          placeholder="tlachat"
          className={`w-full rounded-[18px] border-2 bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune ${
            invalid ? "border-corail" : "border-[#F2DFC9]"
          }`}
        />
        <span className={`text-sm ${invalid ? "text-corail-dark" : "text-[#8A7263]"}`}>
          {hint}
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={`font-heading inline-flex items-center gap-2.5 rounded-2xl px-6.5 py-4 text-[17px] font-bold ${
            canSave
              ? "cursor-pointer bg-corail text-creme hover:bg-[#D45F37]"
              : "cursor-default bg-[#F2DFC9] text-[#A08D7E]"
          }`}
        >
          {isPending && <KdovieSpinner className="h-4.5 w-4.5" />}
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        {dirty && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-2.5 py-2.5 text-[15px] font-semibold text-[#8A7263] hover:text-corail"
          >
            Annuler
          </button>
        )}
        {saved && (
          <span className="rounded-full bg-[#DCE7DA] px-4 py-2.5 text-[15px] font-semibold text-[#2F4A2C]">
            Pseudo enregistré
          </span>
        )}
        {erreur && <span className="text-sm text-corail-dark">{erreur}</span>}
      </div>
    </section>
  );
}
