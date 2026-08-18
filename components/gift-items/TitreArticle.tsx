"use client";

import { useState } from "react";

// "Voir plus" pour le titre complet d'un article, voir CLAUDE.md >
// "Raccourcissement automatique du titre scrapé". Pas d'infobulle native
// (title="") — support erratique en lecteur d'écran, inaccessible au
// clavier/tactile. Le bouton reste TOUJOURS un frère du lien/texte, jamais
// imbriqué dedans (un <button> dans un <a> est invalide en HTML et casse
// l'accessibilité) — c'est la raison d'être de ce composant plutôt que de
// dupliquer la logique lien/texte à chaque endroit.
export default function TitreArticle({
  title,
  originalTitle,
  sourceUrl,
  sponsored = false,
  className,
}: {
  title: string;
  originalTitle: string | null;
  sourceUrl: string | null;
  // Lien affilié (voir CLAUDE.md > "Liens d'affiliation") — rel="sponsored"
  // en plus de noopener/noreferrer, uniquement quand sourceUrl a déjà été
  // transformé par getAffiliateLink côté appelant. Jamais vrai sur la page
  // de gestion, un organisateur ne clique pas pour acheter sa propre liste.
  sponsored?: boolean;
  className: string;
}) {
  const [deplie, setDeplie] = useState(false);
  const aVoirPlus = Boolean(originalTitle && originalTitle.trim());
  const texteAffiche = deplie && originalTitle ? originalTitle : title;

  return (
    <>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel={sponsored ? "sponsored noopener noreferrer" : "noopener noreferrer"}
          className={`${className} hover:text-corail hover:underline`}
        >
          {texteAffiche}
        </a>
      ) : (
        <span className={className}>{texteAffiche}</span>
      )}
      {aVoirPlus && (
        <button
          type="button"
          aria-expanded={deplie}
          aria-label={deplie ? "Réduire le titre" : "Afficher le titre complet"}
          onClick={() => setDeplie((value) => !value)}
          className="ml-1.5 align-baseline text-sm font-semibold text-corail underline"
        >
          {deplie ? "réduire" : "… voir plus"}
        </button>
      )}
    </>
  );
}
