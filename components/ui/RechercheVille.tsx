"use client";

import { useEffect, useRef, useState } from "react";

// Code postal + ville avec suggestion automatique, réutilisé à la fois sur
// /compte/profil (renseigner sa ville) et /recherche (chercher une ville) —
// voir CLAUDE.md > "Recherche publique d'organisateurs par nom et ville".
// API Adresse du gouvernement (api-adresse.data.gouv.fr), gratuite et sans
// clé, vérifiée par appel réel : `properties.postcode`/`properties.city`
// sont les bons noms de champs (pas devinés depuis la doc).
//
// Composant "posé dans" n'importe quel <form> englobant : deux champs
// cachés (postalCodeFieldName/cityFieldName) portent la valeur retenue,
// soumis normalement avec le reste du formulaire parent — pas de logique
// de soumission propre ici.
type Commune = { nom: string; codePostal: string };

export default function RechercheVille({
  initialPostalCode = "",
  initialCity = "",
  postalCodeFieldName = "postal_code",
  cityFieldName = "city",
  required = false,
  onChange,
}: {
  initialPostalCode?: string;
  initialCity?: string;
  postalCodeFieldName?: string;
  cityFieldName?: string;
  required?: boolean;
  // Optionnel : pour un parent qui pilote sa soumission en JS (useTransition
  // + appel direct de la Server Action, convention déjà en place dans ce
  // produit — voir ContactForm) plutôt que de laisser un <form> natif lire
  // les champs cachés ci-dessous. Les deux mécanismes cohabitent, chaque
  // parent utilisant celui qui lui convient.
  onChange?: (value: { postalCode: string; city: string }) => void;
}) {
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [city, setCity] = useState(initialCity);
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [recherche, setRecherche] = useState(false);

  // Réf plutôt que d'inclure `onChange` dans les dépendances : un parent qui
  // passe une fonction inline (nouvelle identité à chaque rendu) déclencherait
  // sinon l'effet en boucle dès que ce callback appelle setState côté parent.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({ postalCode, city });
  }, [postalCode, city]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Le nettoyage immédiat des suggestions pour un code postal invalide se
    // fait dans le onChange de l'input ci-dessous (un vrai gestionnaire
    // d'événement, pas un effet) — un appel synchrone à setState ici
    // déclencherait la règle react-hooks/set-state-in-effect.
    if (!/^\d{5}$/.test(postalCode)) return;

    debounceRef.current = setTimeout(async () => {
      setRecherche(true);
      try {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${postalCode}&type=municipality&limit=10`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          features?: { properties?: { city?: string; postcode?: string } }[];
        };
        const communes = (data.features ?? [])
          .filter((f) => f.properties?.postcode === postalCode && f.properties?.city)
          .map((f) => ({ nom: f.properties!.city!, codePostal: postalCode }));
        const uniques = Array.from(new Map(communes.map((c) => [c.nom, c])).values());
        setSuggestions(uniques);
        // Une seule commune trouvée pour ce code postal : la retenir
        // directement, pas besoin de faire choisir l'organisateur.
        if (uniques.length === 1) setCity(uniques[0].nom);
      } catch {
        setSuggestions([]);
      } finally {
        setRecherche(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [postalCode]);

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="font-heading text-base font-bold text-[#4A3529]">Code postal</span>
        <input
          type="text"
          inputMode="numeric"
          value={postalCode}
          onChange={(event) => {
            setPostalCode(event.target.value.trim());
            setCity("");
            setSuggestions([]);
          }}
          placeholder="75001"
          required={required}
          className="rounded-[18px] border-2 border-[#F2DFC9] bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-heading text-base font-bold text-[#4A3529]">Ville</span>
        {suggestions.length > 1 ? (
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            required={required}
            className="rounded-[18px] border-2 border-[#F2DFC9] bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:border-corail"
          >
            <option value="">Choisissez votre commune…</option>
            {suggestions.map((commune) => (
              <option key={commune.nom} value={commune.nom}>
                {commune.nom}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={city}
            readOnly
            placeholder={recherche ? "Recherche…" : "Code postal d'abord"}
            className="rounded-[18px] border-2 border-[#F2DFC9] bg-[#F7E7D6] px-4.5 py-4 text-[17px] text-[#8A7263] outline-none"
          />
        )}
      </label>

      <input type="hidden" name={postalCodeFieldName} value={postalCode} />
      <input type="hidden" name={cityFieldName} value={city} />
    </div>
  );
}
