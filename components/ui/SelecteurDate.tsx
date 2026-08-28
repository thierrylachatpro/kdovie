"use client";

import { useEffect, useRef, useState } from "react";

const JOURS_SEMAINE = ["L", "M", "M", "J", "V", "S", "D"];
const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

// Grille du mois, cases vides (null) avant le 1er pour aligner sur lundi.
function joursDuMois(annee: number, mois: number): (Date | null)[] {
  const premierJour = new Date(annee, mois, 1);
  const decalage = (premierJour.getDay() + 6) % 7; // getDay(): 0=dimanche → on veut 0=lundi
  const nbJours = new Date(annee, mois + 1, 0).getDate();
  const cases: (Date | null)[] = Array(decalage).fill(null);
  for (let jour = 1; jour <= nbJours; jour++) {
    cases.push(new Date(annee, mois, jour));
  }
  return cases;
}

// Sélecteur de date "maison" pour remplacer le calendrier natif du
// navigateur — non stylable de façon cohérente ni fiable entre
// navigateurs (Firefox n'expose aucun hook CSS sur son propre calendrier).
// Voir CLAUDE.md, amélioration visuelle du calendrier sur
// /compte/evenements/nouveau. Zéro dépendance ajoutée : popover contrôlé
// en state React, avec un champ caché pour rester compatible avec les
// Server Actions existantes (même name/format YYYY-MM-DD que le natif
// <input type="date">).
export default function SelecteurDate({
  name,
  defaultValue = "",
  placeholder = "Choisir une date",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [valeur, setValeur] = useState(defaultValue);
  const [ouvert, setOuvert] = useState(false);
  const aujourdHui = new Date();
  const dateInitiale = parseISODate(defaultValue) ?? aujourdHui;
  const [vueMois, setVueMois] = useState(dateInitiale.getMonth());
  const [vueAnnee, setVueAnnee] = useState(dateInitiale.getFullYear());
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function handleClickOutside(event: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(event.target as Node)) {
        setOuvert(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOuvert(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [ouvert]);

  function moisPrecedent() {
    if (vueMois === 0) {
      setVueMois(11);
      setVueAnnee((a) => a - 1);
    } else {
      setVueMois((m) => m - 1);
    }
  }

  function moisSuivant() {
    if (vueMois === 11) {
      setVueMois(0);
      setVueAnnee((a) => a + 1);
    } else {
      setVueMois((m) => m + 1);
    }
  }

  function ouvrir() {
    const selectionnee = parseISODate(valeur);
    if (selectionnee) {
      setVueMois(selectionnee.getMonth());
      setVueAnnee(selectionnee.getFullYear());
    }
    setOuvert(true);
  }

  const dateSelectionnee = valeur ? parseISODate(valeur) : null;
  const libelle = dateSelectionnee
    ? dateSelectionnee.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : placeholder;

  return (
    <div className="relative" ref={conteneurRef}>
      <input type="hidden" name={name} value={valeur} />
      <button
        type="button"
        onClick={() => (ouvert ? setOuvert(false) : ouvrir())}
        aria-haspopup="dialog"
        aria-expanded={ouvert}
        className={`flex w-full items-center justify-between gap-2 rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] outline-none focus:border-corail ${
          dateSelectionnee ? "text-[#4A3529]" : "text-[#8A7263]"
        }`}
      >
        {libelle}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="flex-none text-corail"
        >
          <rect x="2.5" y="4" width="15" height="13.5" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M2.5 8h15" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M6.5 2.5v3M13.5 2.5v3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-label="Choisir une date"
          className="absolute z-10 mt-2 w-[320px] rounded-[22px] border-2 border-[#F2DFC9] bg-white p-4.5 shadow-[0_12px_32px_rgba(122,90,22,0.15)]"
        >
          <div className="mb-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={moisPrecedent}
              aria-label="Mois précédent"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#8A7263] hover:bg-[#F5E3C9] hover:text-[#4A3529]"
            >
              ‹
            </button>
            <span className="font-heading text-[15px] font-bold text-[#4A3529]">
              {MOIS[vueMois]} {vueAnnee}
            </span>
            <button
              type="button"
              onClick={moisSuivant}
              aria-label="Mois suivant"
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#8A7263] hover:bg-[#F5E3C9] hover:text-[#4A3529]"
            >
              ›
            </button>
          </div>

          <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[12px] font-semibold text-[#8A7263]">
            {JOURS_SEMAINE.map((jour, index) => (
              <span key={index}>{jour}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {joursDuMois(vueAnnee, vueMois).map((date, index) => {
              if (!date) return <span key={`vide-${index}`} />;
              const iso = toISODate(date);
              const estSelectionne = iso === valeur;
              const estAujourdHui = iso === toISODate(aujourdHui);
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setValeur(iso);
                    setOuvert(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[14px] font-semibold ${
                    estSelectionne
                      ? "bg-corail text-creme"
                      : estAujourdHui
                        ? "border-2 border-corail text-corail"
                        : "text-[#4A3529] hover:bg-[#F5E3C9]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {valeur && (
            <button
              type="button"
              onClick={() => {
                setValeur("");
                setOuvert(false);
              }}
              className="mt-3.5 text-[13px] font-semibold text-[#8A7263] hover:text-corail"
            >
              Effacer la date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
