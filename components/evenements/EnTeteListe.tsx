"use client";

import { useState, type ChangeEvent } from "react";
import { updateEvent } from "@/app/compte/evenements/[slug]/event-actions";
import { EVENT_TYPES, eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

export default function EnTeteListe({
  eventId,
  slug,
  name,
  type,
  eventDate,
  itemCount,
}: {
  eventId: string;
  slug: string;
  name: string;
  type: string | null;
  eventDate: string | null;
  itemCount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState({ name, type, eventDate: eventDate ?? "" });
  const [draft, setDraft] = useState(current);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const dateFormatee = current.eventDate
    ? new Date(current.eventDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const meta = [eventTypeLabel(current.type), dateFormatee, `${itemCount} cadeaux`]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  function startEdit() {
    setDraft(current);
    setErreur(null);
    setEditing(true);
  }

  function cancel() {
    setErreur(null);
    setEditing(false);
  }

  async function handleSave() {
    setErreur(null);
    setIsPending(true);
    const result = await updateEvent(eventId, slug, {
      name: draft.name,
      type: draft.type,
      eventDate: draft.eventDate,
    });
    setIsPending(false);
    if (result.error) {
      setErreur(result.error);
      return;
    }
    setCurrent(draft);
    setEditing(false);
  }

  if (!editing) {
    return (
      <section className="mb-7 rounded-[32px] bg-[#F7E7D6] p-8">
        <div className="flex flex-wrap items-center gap-5.5">
          <span className="flex h-18 w-18 flex-none items-center justify-center rounded-[24px] bg-corail text-[32px]">
            {eventTypeIcon(current.type)}
          </span>
          <div className="min-w-60 flex-1">
            <h1 className="font-heading text-4xl leading-[1.1] font-bold text-[#C0512A]">
              {current.name}
            </h1>
            <div className="text-base text-[#7A6354]">{meta}</div>
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="font-heading rounded-2xl bg-creme px-5 py-3.5 text-[15px] font-bold text-[#5C4436] hover:bg-white"
          >
            Modifier
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-7 rounded-[32px] bg-[#F7E7D6] p-8">
      <h2 className="font-heading mb-5 text-2xl font-bold text-[#C0512A]">
        Modifier la liste
      </h2>

      <label className="mb-5 flex max-w-130 flex-col gap-2">
        <span className="font-heading text-base font-bold text-[#4A3529]">
          Nom de la liste
        </span>
        <input
          type="text"
          value={draft.name}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setDraft((d) => ({ ...d, name: event.target.value }))
          }
          placeholder="Ma liste d'envies"
          className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
        />
      </label>

      <div className="mb-5">
        <div className="mb-2.5 font-heading text-base font-bold text-[#4A3529]">
          Type{" "}
          <span className="font-sans text-sm font-medium text-[#8A7263]">— facultatif</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, type: null }))}
            className={`font-heading inline-flex items-center gap-2 rounded-full border-2 px-4.5 py-2.5 text-[15px] font-semibold ${
              draft.type === null
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
              onClick={() => setDraft((d) => ({ ...d, type: t.id }))}
              className={`font-heading inline-flex items-center gap-2 rounded-full border-2 px-4.5 py-2.5 text-[15px] font-semibold ${
                draft.type === t.id
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

      <div className="mb-6 flex flex-wrap items-center gap-3.5 text-[15px] text-[#7A6354]">
        <span>Date (facultative)</span>
        <input
          type="date"
          value={draft.eventDate}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setDraft((d) => ({ ...d, eventDate: event.target.value }))
          }
          className="rounded-[14px] border-2 border-[#F2DFC9] bg-creme px-3.5 py-2.5 text-[15px] text-[#5C4436] outline-none focus:border-corail"
        />
      </div>

      {erreur && <p className="mb-3 text-sm text-corail-dark">{erreur}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="font-heading inline-flex items-center gap-2.5 rounded-[18px] bg-corail px-6 py-4 text-base font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
        >
          {isPending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={isPending}
          className="px-3 py-4 text-base font-semibold text-[#8A7263]"
        >
          Annuler
        </button>
      </div>
    </section>
  );
}
