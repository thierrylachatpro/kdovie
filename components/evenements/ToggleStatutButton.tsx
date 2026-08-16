"use client";

import { useState, useTransition } from "react";
import { updateEventStatus } from "@/app/compte/evenements/[slug]/event-status-actions";
import type { EventStatus } from "@/lib/event-status";

export default function ToggleStatutButton({
  eventId,
  slug,
  status,
}: {
  eventId: string;
  slug: string;
  status: EventStatus;
}) {
  const [value, setValue] = useState(status);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next: EventStatus = value === "brouillon" ? "ouverte" : "brouillon";
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

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          value === "brouillon"
            ? "rounded-lg bg-corail px-5 py-2.5 text-sm font-medium text-creme disabled:opacity-60"
            : "rounded-lg border border-corail px-5 py-2.5 text-sm font-medium text-corail disabled:opacity-60"
        }
      >
        {value === "brouillon" ? "Ouvrir ma liste aux invités" : "Repasser en brouillon"}
      </button>
      {erreur && <span className="text-xs text-corail-dark">{erreur}</span>}
    </div>
  );
}
