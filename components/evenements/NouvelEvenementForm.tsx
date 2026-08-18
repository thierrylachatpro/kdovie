"use client";

import { useState, type ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import { EVENT_TYPES } from "@/lib/event-types";
import { generateEventSlug, slugify } from "@/lib/slug";
import { createEvent } from "@/app/compte/evenements/nouveau/actions";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

// useFormStatus doit être appelé depuis un descendant du <form>, voir
// AjouterArticleForm pour le même besoin.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-heading mt-1.5 inline-flex items-center justify-center gap-2.5 rounded-2xl bg-corail px-6 py-4 text-base font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
    >
      {pending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
      {pending ? "Création…" : "Créer la liste"}
    </button>
  );
}

export default function NouvelEvenementForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [slugModifie, setSlugModifie] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugModifie) {
      setSlug(value.trim() ? generateEventSlug(value) : "");
    }
  }

  function handleSlugChange(value: string) {
    setSlugModifie(true);
    setSlug(slugify(value));
  }

  return (
    <form action={createEvent} className="flex flex-col gap-4.5">
      <input type="hidden" name="type" value={type ?? ""} />

      <div>
        <div className="mb-2.5 font-heading text-base font-bold text-[#4A3529]">
          Type de liste{" "}
          <span className="font-sans text-sm font-medium text-[#8A7263]">— facultatif</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setType(null)}
            className={`font-heading inline-flex items-center gap-2 rounded-full border-2 px-4.5 py-2.5 text-[15px] font-semibold ${
              type === null
                ? "border-corail bg-corail text-creme"
                : "border-[#F2DFC9] bg-creme text-[#5C4436]"
            }`}
          >
            <span className="text-[17px]">🎁</span>Aucun type précis
          </button>
          {EVENT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`font-heading inline-flex items-center gap-2 rounded-full border-2 px-4.5 py-2.5 text-[15px] font-semibold ${
                type === t.id
                  ? "border-corail bg-corail text-creme"
                  : "border-[#F2DFC9] bg-creme text-[#5C4436]"
              }`}
            >
              <span className="text-[17px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-heading text-base font-bold text-[#4A3529]">Nom de la liste</span>
        <input
          type="text"
          name="name"
          required
          placeholder="Naissance de Léa"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) => handleNameChange(event.target.value)}
          className="rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-heading text-base font-bold text-[#4A3529]">
          Date{" "}
          <span className="text-sm font-medium text-[#8A7263]">— facultatif</span>
        </span>
        <input
          type="date"
          name="event_date"
          className="rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-heading text-base font-bold text-[#4A3529]">Lien de la liste</span>
        <input
          type="text"
          name="slug"
          required
          value={slug}
          onChange={(event: ChangeEvent<HTMLInputElement>) => handleSlugChange(event.target.value)}
          className="rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
        />
        <span className="text-[15px] text-[#8A7263]">kdovie.com/liste/{slug || "…"}</span>
      </label>

      <SubmitButton />
    </form>
  );
}
