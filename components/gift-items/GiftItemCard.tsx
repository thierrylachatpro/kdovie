"use client";

import { useState, type ChangeEvent } from "react";
import {
  deleteGiftItem,
  updateGiftItem,
} from "@/app/compte/evenements/[slug]/gift-item-actions";
import { GIFT_ITEM_MODES, formatPriceCents } from "@/lib/gift-item";
import ModeSelect from "@/components/gift-items/ModeSelect";

type GiftItem = {
  id: string;
  title: string;
  price_cents: number | null;
  image_url: string | null;
  description: string | null;
  status: string;
  mode: string;
  funded_amount_cents: number;
};

const TONES = ["#F7D9C9", "#F5E3C9", "#DCE7DA"];

const BADGES: Record<string, { bg: string; fg: string; label: string }> = {
  disponible: { bg: "#DCE7DA", fg: "#2F4A2C", label: "Disponible" },
  reserve: { bg: "#F7E7D6", fg: "#7A6354", label: "Réservé" },
  cagnotte: { bg: "#F5E3C9", fg: "#7A5A16", label: "Cagnotte en cours" },
};

export default function GiftItemCard({
  item,
  slug,
  toneIndex,
  reservedByName,
}: {
  item: GiftItem;
  slug: string;
  toneIndex: number;
  reservedByName: string | null;
}) {
  const [mode, setMode] = useState<"reading" | "editing" | "confirming">("reading");
  const [draftTitle, setDraftTitle] = useState(item.title);
  const [draftPrice, setDraftPrice] = useState(
    item.price_cents !== null ? (item.price_cents / 100).toFixed(2) : "",
  );
  const [draftImage, setDraftImage] = useState(item.image_url ?? "");
  const [draftDescription, setDraftDescription] = useState(item.description ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [nomRevele, setNomRevele] = useState(false);

  const locked = item.status !== "disponible";
  const badge = BADGES[item.status] ?? BADGES.disponible;
  const modeLabel = GIFT_ITEM_MODES.find((m) => m.id === item.mode)?.label ?? item.mode;
  const percent =
    item.status === "cagnotte" && item.price_cents
      ? Math.round((item.funded_amount_cents / item.price_cents) * 100)
      : 0;

  function startEdit() {
    setDraftTitle(item.title);
    setDraftPrice(item.price_cents !== null ? (item.price_cents / 100).toFixed(2) : "");
    setDraftImage(item.image_url ?? "");
    setDraftDescription(item.description ?? "");
    setErreur(null);
    setMode("editing");
  }

  function cancel() {
    setErreur(null);
    setMode("reading");
  }

  async function handleSave() {
    setErreur(null);
    setIsPending(true);
    const result = await updateGiftItem(item.id, slug, {
      title: draftTitle,
      price: draftPrice,
      imageUrl: draftImage,
      description: draftDescription,
    });
    setIsPending(false);
    if (result.error) {
      setErreur(result.error);
      return;
    }
    setMode("reading");
  }

  async function handleConfirmDelete() {
    setErreur(null);
    setIsPending(true);
    const result = await deleteGiftItem(item.id, slug);
    setIsPending(false);
    if (result.error) {
      setErreur(result.error);
      return;
    }
    setMode("reading");
  }

  return (
    <article
      className={`rounded-[26px] border-2 p-6 ${
        mode === "confirming"
          ? "border-corail"
          : locked
            ? "border-[#EFE3D4] bg-[#FDF3E9]"
            : "border-[#F2DFC9] bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start gap-5">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            className={`h-22 w-22 flex-none rounded-[22px] object-cover ${locked ? "opacity-80" : ""}`}
          />
        ) : (
          <div
            className={`flex h-22 w-22 flex-none items-center justify-center rounded-[22px] text-[34px] ${locked ? "opacity-80" : ""}`}
            style={{ background: TONES[toneIndex % TONES.length] }}
          >
            🎁
          </div>
        )}

        <div className="min-w-60 flex-1">
          {mode === "reading" || mode === "confirming" ? (
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                <h3 className="font-heading text-xl font-bold text-[#4A3529]">{item.title}</h3>
                <span
                  className="rounded-full px-3 py-1.5 text-[13px] font-semibold"
                  style={{ background: badge.bg, color: badge.fg }}
                >
                  {badge.label}
                </span>
              </div>
              <div className="mb-1.5 text-base font-semibold text-[#5C4436]">
                {formatPriceCents(item.price_cents)}
              </div>
              {item.description && (
                <p className="mb-1.5 max-w-130 text-[15px] leading-relaxed text-[#7A6354]">
                  {item.description}
                </p>
              )}
              <ModeSelect itemId={item.id} slug={slug} mode={item.mode} disabled={locked} />
              {!locked && (
                <span className="ml-2 align-middle text-sm text-[#8A7263]">{modeLabel}</span>
              )}

              {item.status === "cagnotte" && (
                <div className="mt-3 max-w-90">
                  <div className="mb-1.5 h-2.5 overflow-hidden rounded-full bg-[#F7E7D6]">
                    <div
                      className="h-2.5 rounded-full bg-sauge"
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                  <div className="text-sm text-[#7A6354]">
                    {formatPriceCents(item.funded_amount_cents)} sur{" "}
                    {formatPriceCents(item.price_cents)}
                  </div>
                </div>
              )}

              {mode === "confirming" && (
                <div className="mt-4 rounded-[18px] bg-[#F7D9C9] p-4.5">
                  <div className="font-heading mb-1.5 text-[17px] font-bold text-[#A8431F]">
                    Supprimer « {item.title} » ?
                  </div>
                  <p className="text-[15px] text-[#8F3A1C]">
                    Le cadeau disparaîtra définitivement de la liste, y compris pour vos
                    invités.
                  </p>
                </div>
              )}

              {item.status === "reserve" && (
                <p className="mt-3.5 max-w-130 border-l-[3px] border-jaune pl-3 text-[15px] leading-relaxed text-[#7A6354]">
                  <button
                    type="button"
                    onClick={() => setNomRevele((v) => !v)}
                    title={nomRevele ? "Masquer" : "Afficher"}
                    className={`font-heading font-semibold text-[#5C4436] ${
                      nomRevele ? "" : "cursor-pointer blur-[5px] select-none"
                    }`}
                  >
                    {reservedByName ?? "Un invité"}
                  </button>{" "}
                  a déjà réservé ce cadeau : il n&apos;est plus modifiable ni supprimable.
                </p>
              )}
              {item.status === "cagnotte" && (
                <p className="mt-3.5 max-w-130 border-l-[3px] border-jaune pl-3 text-[15px] leading-relaxed text-[#7A6354]">
                  Des invités ont commencé à cotiser sur ce cadeau : il n&apos;est plus
                  modifiable ni supprimable.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={draftTitle}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraftTitle(event.target.value)
                }
                placeholder="Titre du cadeau"
                className="rounded-2xl border-2 border-[#F2DFC9] bg-creme px-4 py-3.5 text-base text-[#4A3529] outline-none focus:border-corail"
              />
              <input
                type="text"
                value={draftPrice}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraftPrice(event.target.value)
                }
                placeholder="Prix"
                className="rounded-2xl border-2 border-[#F2DFC9] bg-creme px-4 py-3.5 text-base text-[#4A3529] outline-none focus:border-corail"
              />
              <textarea
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="Quelques précisions (taille, couleur, modèle…)"
                rows={2}
                className="resize-y rounded-2xl border-2 border-[#F2DFC9] bg-creme px-4 py-3.5 text-base text-[#4A3529] outline-none focus:border-corail sm:col-span-2"
              />
              <input
                type="url"
                value={draftImage}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setDraftImage(event.target.value)
                }
                placeholder="Adresse de l'image"
                className="rounded-2xl border-2 border-[#F2DFC9] bg-creme px-4 py-3.5 text-base text-[#4A3529] outline-none focus:border-corail sm:col-span-2"
              />
              {erreur && <p className="text-sm text-corail-dark sm:col-span-2">{erreur}</p>}
            </div>
          )}
        </div>

        <div className="flex flex-none flex-wrap items-start gap-2.5">
          {mode === "reading" && !locked && (
            <>
              <button
                type="button"
                onClick={startEdit}
                className="font-heading rounded-2xl bg-jaune px-5 py-3 text-[15px] font-bold text-[#6B4A0F] hover:bg-[#EBAB2C]"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => setMode("confirming")}
                className="font-heading rounded-2xl border-2 border-[#F2DFC9] bg-creme px-4.5 py-2.5 text-[15px] font-bold text-[#A8431F] hover:border-corail hover:bg-[#F7D9C9]"
              >
                Supprimer
              </button>
            </>
          )}
          {mode === "reading" && locked && (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#F7E7D6] px-4.5 py-3 text-[15px] font-semibold text-[#8A7263]">
              Non modifiable
              <span
                title="Ce cadeau ne peut plus être modifié : un proche l'a déjà réservé ou a commencé à cotiser dessus."
                className="flex h-4.5 w-4.5 flex-none cursor-help items-center justify-center rounded-full bg-[#8A7263]/25 text-[11px] font-bold text-[#8A7263]"
              >
                i
              </span>
            </span>
          )}
          {mode === "editing" && (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="font-heading rounded-2xl bg-corail px-5 py-3 text-[15px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
              >
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={isPending}
                className="px-3 py-3 text-[15px] font-semibold text-[#8A7263]"
              >
                Annuler
              </button>
            </>
          )}
          {mode === "confirming" && (
            <>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="font-heading rounded-2xl bg-corail px-5 py-3 text-[15px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
              >
                {isPending ? "Suppression…" : "Oui, supprimer"}
              </button>
              <button
                type="button"
                onClick={cancel}
                disabled={isPending}
                className="px-3 py-3 text-[15px] font-semibold text-[#8A7263]"
              >
                Annuler
              </button>
            </>
          )}
        </div>
      </div>
      {mode === "confirming" && erreur && (
        <p className="mt-3 text-sm text-corail-dark">{erreur}</p>
      )}
    </article>
  );
}
