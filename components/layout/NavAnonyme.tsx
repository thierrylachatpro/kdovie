"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import StatutLien from "@/components/ui/StatutLien";

// Nav publique pour un visiteur non connecté, symétrique à NavConnecte —
// voir CLAUDE.md > "Nav publique pour les visiteurs anonymes" et
// "Menu hamburger mobile". Rendu null si connecté : chaque page affiche
// NavConnecte à la place, jamais les deux en même temps.
//
// Desktop (md+) : boîte flex classique — 4 ancres d'accueil + "Retrouver une
// liste" + bouton "Se connecter", en ligne.
// Mobile (<md) : la racine passe en `display: contents`, ses enfants
// remontent donc dans le flex du <header> (justify-between). Le hamburger se
// retrouve seul sur la ligne du logo, aligné à droite ; un séparateur
// `w-full` force "Rechercher" + "Se connecter" sur une 2e ligne dessous.
// Aucune modification des <header> nécessaire.
//
// Les ancres pointent vers l'accueil en chemin absolu (/#comment…).

const ANCRES = [
  { href: "/#comment", label: "Comment ça marche" },
  { href: "/#evenements", label: "Occasions" },
  { href: "/#cagnotte", label: "Cagnotte" },
  { href: "/#questions", label: "Questions" },
];

function IconeLoupe() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 14 14" />
    </svg>
  );
}

export default function NavAnonyme({ estConnecte }: { estConnecte: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function onKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOuvert(false);
    }
    function onPointerdown(event: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(event.target as Node)) {
        setOuvert(false);
      }
    }
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("mousedown", onPointerdown);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      document.removeEventListener("mousedown", onPointerdown);
    };
  }, [ouvert]);

  if (estConnecte) return null;

  return (
    <div
      ref={conteneurRef}
      className="contents md:flex md:items-center md:gap-6"
    >
      {/* Hamburger — mobile uniquement. Via `display: contents` sur la racine,
          il devient enfant direct du <header> et se cale à droite du logo. */}
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        aria-controls="menu-anonyme-mobile"
        aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        className="-mr-2 flex h-10 w-10 flex-none items-center justify-center rounded-xl text-[#5C4436] hover:bg-[#F7E7D6] md:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {ouvert ? (
            <path d="M5 5l10 10M15 5L5 15" />
          ) : (
            <>
              <path d="M3 6h14" />
              <path d="M3 10h14" />
              <path d="M3 14h14" />
            </>
          )}
        </svg>
      </button>

      {/* Séparateur : force la 2e ligne sur mobile (rien sur desktop) */}
      <div className="h-0 w-full md:hidden" aria-hidden="true" />

      {/* Ancres — desktop uniquement (dans le hamburger sur mobile) */}
      <nav className="hidden items-center gap-7 text-[15px] font-medium text-[#5C4436] md:flex">
        {ANCRES.map((ancre) => (
          <Link key={ancre.href} href={ancre.href} className="hover:text-corail">
            {ancre.label}
          </Link>
        ))}
      </nav>

      {/* Rechercher + Se connecter : 2e ligne sur mobile (alignée à droite),
          dans le flux sur desktop. `relative` sert d'ancrage au panneau. */}
      <div className="relative flex w-full items-center justify-end gap-2.5 md:w-auto md:gap-6">
        <Link
          href="/recherche"
          className="hidden text-[15px] font-medium text-[#5C4436] hover:text-corail md:inline"
        >
          Retrouver une liste
          <StatutLien />
        </Link>
        <Link
          href="/recherche"
          className="inline-flex flex-none items-center gap-1.5 rounded-2xl border-2 border-[#F2DFC9] px-3 py-2 text-[15px] font-semibold whitespace-nowrap text-[#5C4436] hover:border-corail hover:text-corail md:hidden"
        >
          <IconeLoupe />
          Rechercher
          <StatutLien />
        </Link>
        <Link
          href="/connexion"
          className="flex-none rounded-2xl bg-corail px-4 py-2.5 text-[15px] font-semibold whitespace-nowrap text-creme hover:bg-[#D45F37] sm:px-[22px] sm:py-3"
        >
          Se connecter
          <StatutLien variant="dark" />
        </Link>

        {ouvert && (
          <nav
            id="menu-anonyme-mobile"
            className="absolute top-full right-0 z-30 mt-2 flex w-56 flex-col gap-0.5 rounded-2xl border-2 border-[#F2DFC9] bg-white p-2 shadow-[0_12px_30px_rgba(74,53,41,0.15)] md:hidden"
          >
            {ANCRES.map((ancre) => (
              <Link
                key={ancre.href}
                href={ancre.href}
                onClick={() => setOuvert(false)}
                className="rounded-xl px-3 py-2.5 text-[15px] font-medium text-[#5C4436] hover:bg-[#F7E7D6]"
              >
                {ancre.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
