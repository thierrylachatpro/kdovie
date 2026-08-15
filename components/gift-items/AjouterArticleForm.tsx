"use client";

import { useState, useTransition } from "react";
import { scrapeArticleUrl } from "@/app/compte/evenements/[slug]/scrape-action";
import { createGiftItem } from "@/app/compte/evenements/[slug]/gift-item-actions";

export default function AjouterArticleForm({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAnalyser() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setNote(null);
    startTransition(async () => {
      const result = await scrapeArticleUrl(trimmed);
      if (result.title) setTitle(result.title);
      if (result.priceCents !== null) setPrice((result.priceCents / 100).toFixed(2));
      if (result.imageUrl) setImageUrl(result.imageUrl);
      if (!result.title && result.priceCents === null && !result.imageUrl) {
        setNote(
          "Aucune information trouvée automatiquement — complétez les champs ci-dessous.",
        );
      }
    });
  }

  return (
    <form
      action={createGiftItem}
      className="flex flex-col gap-3 rounded-xl border border-gris/20 bg-white p-5 text-left"
    >
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="slug" value={slug} />

      <label className="flex flex-col gap-1.5 text-sm">
        Lien du produit
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            name="source_url"
            required
            placeholder="https://boutique.exemple.com/produit"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm outline-none focus:border-corail"
          />
          <button
            type="button"
            onClick={handleAnalyser}
            disabled={isPending || !url.trim()}
            className="rounded-lg border border-corail px-4 py-2.5 text-sm font-medium text-corail disabled:opacity-50"
          >
            {isPending ? "Analyse…" : "Analyser"}
          </button>
        </div>
      </label>

      {note && <p className="text-xs text-gris">{note}</p>}

      <label className="flex flex-col gap-1.5 text-sm">
        Titre
        <input
          type="text"
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm outline-none focus:border-corail"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
          Prix (€)
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm outline-none focus:border-corail"
          />
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
          Image (URL)
          <input
            type="url"
            name="image_url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm outline-none focus:border-corail"
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-1 self-start rounded-lg bg-jaune px-5 py-2.5 text-sm font-medium text-corail-dark"
      >
        Ajouter à la liste
      </button>
    </form>
  );
}
