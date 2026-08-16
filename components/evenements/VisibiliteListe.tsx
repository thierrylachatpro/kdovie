"use client";

import { useState, useTransition } from "react";
import { updateEventStatus } from "@/app/compte/evenements/[slug]/event-status-actions";
import type { EventStatus } from "@/lib/event-status";

export default function VisibiliteListe({
  eventId,
  slug,
  status,
  lienPublic,
}: {
  eventId: string;
  slug: string;
  status: EventStatus;
  lienPublic: string;
}) {
  const [value, setValue] = useState(status);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const shared = value === "ouverte";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=264x264&margin=8&color=4A3529&bgcolor=FFF8F0&data=${encodeURIComponent(lienPublic)}`;

  function handleToggle() {
    const next: EventStatus = shared ? "brouillon" : "ouverte";
    const previous = value;
    setValue(next);
    setErreur(null);
    startTransition(async () => {
      const result = await updateEventStatus(eventId, next, slug);
      if (result.error) {
        setValue(previous);
        setErreur(result.error);
      }
    });
  }

  async function handleCopy() {
    if (!shared) return;
    await navigator.clipboard.writeText(lienPublic);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <section
      className={`mb-7 flex flex-wrap items-center gap-6 rounded-[28px] p-6.5 ${
        shared ? "bg-[#DCE7DA]" : "bg-[#F7E7D6]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt="QR code vers la liste"
        width={132}
        height={132}
        className={`block flex-none rounded-[20px] bg-creme p-2 ${shared ? "" : "opacity-45"}`}
      />
      <div className="min-w-70 flex-1">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span
            className={`block h-3.5 w-3.5 flex-none rounded-[5px] ${shared ? "bg-sauge" : "bg-jaune"}`}
          />
          <span className="font-heading text-xl font-bold text-[#4A3529]">
            {shared ? "Vos invités peuvent voir cette liste" : "Vous seul voyez cette liste"}
          </span>
        </div>
        <p className="mb-4 max-w-130 text-[15px] leading-relaxed text-[#7A6354]">
          {shared
            ? "Toute personne à qui vous donnez le lien peut consulter les cadeaux et en réserver. Rien n'apparaît dans les moteurs de recherche."
            : "Personne d'autre que vous n'y a accès, même avec le lien. Ouvrez-la quand vous serez prêt à recevoir des réservations."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`min-w-60 flex-1 rounded-2xl px-4 py-3.5 text-[15px] ${
              shared ? "bg-creme text-[#5C4436]" : "bg-[#F7E7D6] text-[#A08D7E]"
            }`}
          >
            {lienPublic}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!shared}
            className={`font-heading rounded-2xl px-5 py-3.5 text-[15px] font-bold ${
              shared
                ? "cursor-pointer bg-jaune text-[#6B4A0F] hover:bg-[#EBAB2C]"
                : "cursor-default bg-[#F2DFC9] text-[#A08D7E]"
            }`}
          >
            {shared ? (copie ? "Lien copié !" : "Copier le lien") : "Lien inactif"}
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`font-heading rounded-2xl px-6 py-3.5 text-base font-bold disabled:opacity-60 ${
              shared
                ? "bg-creme text-[#2F4A2C] hover:bg-white"
                : "bg-corail text-creme hover:bg-[#D45F37]"
            }`}
          >
            {isPending
              ? "…"
              : shared
                ? "Refermer la liste"
                : "Ouvrir ma liste aux invités"}
          </button>
        </div>
        {erreur && <p className="mt-2.5 text-sm text-corail-dark">{erreur}</p>}
      </div>
    </section>
  );
}
