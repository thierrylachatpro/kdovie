"use client";

import { useState } from "react";
import { formatRelativeTimeFr } from "@/lib/relative-time";

export type ActiviteItem = { nom: string; texte: string; date: string; couleur: string };

// Floutage des noms (révélable d'un clic), même traitement que le
// réservataire/les contributeurs sur la page de gestion — voir CLAUDE.md >
// "Ajustements listes publique et gestion".
export default function FilActivite({ activite }: { activite: ActiviteItem[] }) {
  const [revelees, setRevelees] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setRevelees((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  if (activite.length === 0) {
    return (
      <p className="text-sm text-gris">
        Pas encore d&apos;activité, elle apparaîtra ici dès qu&apos;un proche réservera ou
        cotisera.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {activite.map((a, index) => {
        const revele = revelees.has(index);
        return (
          <div key={index} className="flex items-start gap-3.5">
            <span
              className="mt-1.5 block h-3 w-3 flex-none rounded-[5px]"
              style={{ background: a.couleur }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-base leading-relaxed text-[#4A3529]">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  title={revele ? "Masquer" : "Afficher"}
                  className={`font-heading font-semibold text-[#4A3529] ${
                    revele ? "" : "cursor-pointer blur-[5px] select-none"
                  }`}
                >
                  {a.nom}
                </button>{" "}
                {a.texte}
              </div>
              <div className="mt-1 text-[13px] text-[#8A7263]">{formatRelativeTimeFr(a.date)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
