"use client";

import { useEffect, useId, useRef, useState } from "react";
import { nomCommuneSansArrondissement } from "@/lib/commune";

// Champ "Ville" de /recherche : on tape le nom de la ville (pas le code
// postal — les visiteurs ne connaissent pas celui de leurs proches), une
// liste de communes est suggérée via l'API Adresse (api-adresse.data.gouv.fr,
// même source que RechercheVille sur /compte/profil). Le nom retenu doit être
// exactement celui stocké sur le profil (search_organizers compare à
// l'identique) : on le prend donc toujours dans les suggestions de l'API,
// jamais tel que tapé.
type Commune = { nom: string; departement: string };

function normaliser(valeur: string) {
  return valeur
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-'’\s]+/g, " ")
    .trim()
    .toLowerCase();
}

export default function RechercheVilleParNom({
  initialCity = "",
  name = "city",
  required = false,
}: {
  initialCity?: string;
  name?: string;
  required?: boolean;
}) {
  const [saisie, setSaisie] = useState(initialCity);
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listeId = useId();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Le vidage des suggestions pour une saisie trop courte se fait dans le
    // onChange de l'input (règle react-hooks/set-state-in-effect).
    if (saisie.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(saisie.trim())}&type=municipality&autocomplete=1&limit=10`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          features?: { properties?: { city?: string; context?: string } }[];
        };
        const communes = (data.features ?? [])
          .filter((f) => f.properties?.city)
          .map((f) => ({
            nom: nomCommuneSansArrondissement(f.properties!.city!),
            departement: f.properties?.context?.split(",")[1]?.trim() ?? "",
          }));
        // "Lyon" + "Lyon 3e Arrondissement" deviennent un seul "Lyon".
        const uniques = Array.from(
          new Map(communes.map((c) => [`${c.nom}|${c.departement}`, c])).values(),
        );
        setSuggestions(uniques);
      } catch {
        setSuggestions([]);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [saisie]);

  function choisir(commune: Commune) {
    setSaisie(commune.nom);
    setOuvert(false);
    setActif(-1);
  }

  // En quittant le champ sans avoir cliqué une suggestion ("lyon", "st etienne"…),
  // on se cale sur la commune correspondante pour que l'orthographe soit
  // exactement celle stockée en base.
  function caler() {
    const cible = normaliser(saisie.replace(/^st\b/i, "saint"));
    const correspondance =
      suggestions.find((c) => normaliser(c.nom) === cible) ??
      (suggestions.length === 1 ? suggestions[0] : undefined);
    if (correspondance) setSaisie(correspondance.nom);
  }

  const afficherListe = ouvert && suggestions.length > 0;

  return (
    <label className="relative flex flex-col gap-1.5">
      <span className="font-heading text-base font-bold text-[#4A3529]">Ville</span>
      <input
        type="text"
        name={name}
        value={saisie}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={afficherListe}
        aria-controls={listeId}
        aria-autocomplete="list"
        aria-activedescendant={actif >= 0 ? `${listeId}-${actif}` : undefined}
        placeholder="Amiens"
        onChange={(event) => {
          setSaisie(event.target.value);
          setOuvert(true);
          setActif(-1);
          if (event.target.value.trim().length < 2) setSuggestions([]);
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => {
          caler();
          setOuvert(false);
        }}
        onKeyDown={(event) => {
          if (!afficherListe) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActif((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActif((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter" && actif >= 0) {
            event.preventDefault();
            choisir(suggestions[actif]);
          } else if (event.key === "Escape") {
            setOuvert(false);
          }
        }}
        className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
      />
      {afficherListe && (
        <ul
          id={listeId}
          role="listbox"
          className="absolute top-full z-10 mt-1.5 w-full overflow-hidden rounded-[18px] border-2 border-[#F2DFC9] bg-white shadow-sm"
        >
          {suggestions.map((commune, index) => (
            <li
              key={`${commune.nom}|${commune.departement}`}
              id={`${listeId}-${index}`}
              role="option"
              aria-selected={index === actif}
              // mousedown plutôt que click : passe avant le blur de l'input.
              onMouseDown={(event) => {
                event.preventDefault();
                choisir(commune);
              }}
              className={`cursor-pointer px-4.5 py-3 text-[16px] text-[#4A3529] ${
                index === actif ? "bg-[#F7E7D6]" : "hover:bg-creme"
              }`}
            >
              {commune.nom}
              {commune.departement && (
                <span className="text-[#8A7263]"> · {commune.departement}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
