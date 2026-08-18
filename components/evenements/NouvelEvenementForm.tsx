"use client";

import { useState } from "react";
import { EVENT_TYPES } from "@/lib/event-types";
import { generateEventSlug, slugify } from "@/lib/slug";
import { createEvent } from "@/app/compte/evenements/nouveau/actions";

export default function NouvelEvenementForm() {
  const [name, setName] = useState("");
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
    <form action={createEvent} className="flex w-full max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-left text-sm">
        Type de liste
        <select
          name="type"
          defaultValue=""
          className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-corail"
        >
          <option value="">🎁 Aucun type précis / liste simple</option>
          {EVENT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.icon} {t.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-left text-sm">
        Nom de la liste
        <input
          type="text"
          name="name"
          required
          placeholder="Naissance de Léa"
          value={name}
          onChange={(event) => handleNameChange(event.target.value)}
          className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-corail"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-left text-sm">
        Date (optionnelle)
        <input
          type="date"
          name="event_date"
          className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-corail"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-left text-sm">
        Lien de la liste
        <input
          type="text"
          name="slug"
          required
          value={slug}
          onChange={(event) => handleSlugChange(event.target.value)}
          className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-corail"
        />
        <span className="text-xs text-gris">kdovie.com/liste/{slug || "…"}</span>
      </label>

      <button
        type="submit"
        className="mt-2 rounded-lg bg-jaune px-5 py-2.5 text-sm font-medium text-corail-dark"
      >
        Créer la liste
      </button>
    </form>
  );
}
