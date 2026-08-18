"use client";

import { useState, useTransition } from "react";
import { restoreEvent } from "@/app/admin/actions";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

export default function RestaurerButton({ eventId }: { eventId: string }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setErreur(null);
    startTransition(async () => {
      const result = await restoreEvent(eventId);
      if (result.error) setErreur(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-5 py-3 text-[15px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
      >
        {isPending && <KdovieSpinner className="h-4 w-4" variant="dark" />}
        {isPending ? "Restauration…" : "Restaurer"}
      </button>
      {erreur && <span className="text-xs text-corail-dark">{erreur}</span>}
    </div>
  );
}
