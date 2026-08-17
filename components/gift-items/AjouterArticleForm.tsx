"use client";

import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { scrapeArticleUrl } from "@/app/compte/evenements/[slug]/scrape-action";
import { createGiftItem } from "@/app/compte/evenements/[slug]/gift-item-actions";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

// useFormStatus doit être appelé depuis un descendant du <form>, pas depuis
// le composant qui le rend — d'où ce bouton séparé. Sans lui, le clic sur
// "Ajouter à la liste" ne donnait aucun retour visuel pendant l'aller-retour
// serveur (insertion + rafraîchissement de la page), ce qui donnait
// l'impression que c'était lent.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-heading mt-1.5 inline-flex items-center gap-2.5 self-start rounded-[18px] bg-corail px-6 py-4 text-base font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
    >
      {pending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
      {pending ? "Ajout en cours…" : "Ajouter à la liste"}
    </button>
  );
}

export default function AjouterArticleForm({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  const [tab, setTab] = useState<"lien" | "manuel">("lien");
  const [linkRevealed, setLinkRevealed] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showFields = tab === "manuel" || linkRevealed;

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
      setLinkRevealed(true);
    });
  }

  function tabButtonClass(active: boolean) {
    return `font-heading flex-1 rounded-[14px] px-3 py-3.5 text-base font-bold ${
      active ? "bg-creme text-[#C0512A]" : "bg-transparent text-[#7A6354]"
    }`;
  }

  return (
    <section className="rounded-[28px] border-2 border-[#F2DFC9] bg-white p-7.5">
      <h2 className="font-heading mb-4.5 text-[22px] font-bold text-[#4A3529]">
        Ajouter un cadeau
      </h2>

      <div className="mb-5.5 flex max-w-105 gap-2 rounded-[18px] bg-[#F7E7D6] p-1.5">
        <button type="button" onClick={() => setTab("lien")} className={tabButtonClass(tab === "lien")}>
          Par lien
        </button>
        <button
          type="button"
          onClick={() => setTab("manuel")}
          className={tabButtonClass(tab === "manuel")}
        >
          Saisie manuelle
        </button>
      </div>

      <form
        action={createGiftItem}
        className="flex flex-col gap-3.5"
      >
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="slug" value={slug} />

        {tab === "lien" && (
          <label className="flex flex-col gap-1.5">
            <span className="font-heading text-base font-bold text-[#4A3529]">
              Lien du produit
            </span>
            <div className="flex flex-wrap gap-3">
              <input
                type="url"
                name="source_url"
                required
                placeholder="https://boutique.fr/produit…"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="min-w-65 flex-1 rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
              />
              <button
                type="button"
                onClick={handleAnalyser}
                disabled={isPending || !url.trim()}
                className="font-heading inline-flex items-center gap-2.5 rounded-[18px] bg-corail px-6 py-4 text-base font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
              >
                {isPending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
                {isPending ? "Recherche…" : "Récupérer le cadeau"}
              </button>
            </div>
            {!linkRevealed && (
              <span className="text-[15px] text-[#8A7263]">
                Le titre, le prix et l&apos;image sont remplis automatiquement. Vous pourrez les
                corriger ensuite.
              </span>
            )}
          </label>
        )}

        {note && <p className="text-sm text-[#8A7263]">{note}</p>}

        {showFields && (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="font-heading text-base font-bold text-[#4A3529]">Titre</span>
              <input
                type="text"
                name="title"
                required
                placeholder="Titre du cadeau"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
              />
            </label>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-heading text-base font-bold text-[#4A3529]">Prix</span>
                <input
                  type="text"
                  name="price"
                  placeholder="ex. 45 €"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-heading text-base font-bold text-[#4A3529]">
                  Adresse de l&apos;image{" "}
                  <span className="text-sm font-medium text-[#8A7263]">— facultatif</span>
                </span>
                <input
                  type="url"
                  name="image_url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  className="rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="font-heading text-base font-bold text-[#4A3529]">
                Quelques précisions{" "}
                <span className="text-sm font-medium text-[#8A7263]">— facultatif</span>
              </span>
              <textarea
                name="description"
                rows={2}
                placeholder="Taille, couleur, modèle…"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="resize-y rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
              />
            </label>

            <SubmitButton />
          </>
        )}
      </form>
    </section>
  );
}
