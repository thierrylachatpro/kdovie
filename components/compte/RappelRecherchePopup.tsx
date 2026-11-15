"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

// Fenêtre affichée sur /compte quand l'organisateur a au moins une liste
// ouverte mais n'a pas activé la recherche publique : ses proches ne peuvent
// alors retrouver ses listes qu'avec le lien. « Plus tard » la masque pour la
// session (sessionStorage), elle revient à la visite suivante.
const CLE = "kdovie-rappel-recherche";

export default function RappelRecherchePopup() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Lecture différée (règle react-hooks/set-state-in-effect).
    const timer = setTimeout(() => {
      let dejaVu = false;
      try {
        dejaVu = window.sessionStorage.getItem(CLE) === "1";
      } catch {
        dejaVu = false;
      }
      if (!dejaVu) setOpen(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const fermer = useCallback(() => {
    try {
      window.sessionStorage.setItem(CLE, "1");
    } catch {
      // stockage indisponible : la fenêtre reviendra simplement plus tard
    }
    setOpen(false);
  }, []);

  // Focus piégé + Échap = « Plus tard ».
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const precedent = document.activeElement as HTMLElement | null;
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        fermer();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button"));
      if (focusables.length === 0) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === premier) {
        event.preventDefault();
        dernier.focus();
      } else if (!event.shiftKey && document.activeElement === dernier) {
        event.preventDefault();
        premier.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      precedent?.focus?.();
    };
  }, [open, fermer]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#4A3529]/45 sm:items-center sm:p-6"
      onClick={fermer}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rappel-recherche-titre"
        aria-describedby="rappel-recherche-texte"
        className="w-full max-w-120 rounded-t-[28px] bg-creme p-6.5 sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#FDF2DA] text-3xl">
          <span aria-hidden="true">🔍</span>
        </div>
        <h2 id="rappel-recherche-titre" className="font-heading mb-2 text-2xl font-bold text-[#4A3529]">
          Vos proches ne peuvent pas vous trouver
        </h2>
        <p id="rappel-recherche-texte" className="mb-5 text-[16px] leading-relaxed text-[#7A6354]">
          Vos listes sont ouvertes, mais elles n&apos;apparaissent pas dans la recherche de Kdovie :
          on ne peut les retrouver qu&apos;avec le lien que vous envoyez. Activez la recherche pour
          que vos proches les trouvent avec votre prénom et votre ville.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/compte/profil#recherche-publique"
            data-autofocus
            onClick={() => {
              try {
                window.sessionStorage.setItem(CLE, "1");
              } catch {}
            }}
            className="font-heading inline-flex items-center justify-center rounded-[18px] bg-corail px-6 py-4 text-base font-bold text-creme hover:bg-[#D45F37]"
          >
            Me rendre trouvable
          </Link>
          <button
            type="button"
            onClick={fermer}
            className="font-heading rounded-[18px] bg-white px-6 py-4 text-base font-bold text-[#5C4436] hover:bg-[#F7E7D6]"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
