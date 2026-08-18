"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateGiftItemMode } from "@/app/compte/evenements/[slug]/gift-item-actions";
import { GIFT_ITEM_MODES } from "@/lib/gift-item";

export default function ModeSelect({
  itemId,
  slug,
  mode,
  disabled,
}: {
  itemId: string;
  slug: string;
  mode: string;
  disabled: boolean;
}) {
  const [value, setValue] = useState(mode);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextMode = event.target.value;
    const previous = value;
    setValue(nextMode);
    setErreur(null);
    startTransition(async () => {
      const result = await updateGiftItemMode(itemId, nextMode, slug);
      if (result.error) {
        setValue(previous);
        setErreur(result.error);
      }
    });
  }

  return (
    <div className="flex max-w-70 flex-col gap-1">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled || isPending}
        className="w-full rounded-lg border border-gris/30 bg-white px-3 py-1.5 text-xs text-foreground outline-none focus:border-corail disabled:opacity-50"
      >
        {GIFT_ITEM_MODES.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {erreur && <span className="text-xs text-corail-dark">{erreur}</span>}
    </div>
  );
}
