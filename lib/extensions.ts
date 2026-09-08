// Liens vers l'extension navigateur Kdovie sur les différents stores — voir
// CLAUDE.md > "Extension navigateur Chrome". Tant que `url` vaut `null`, le
// store n'a pas encore publié l'extension : l'UI affiche « Bientôt » au lieu
// d'un lien. Renseigner la constante dès que le store correspondant a validé
// l'extension (ex. Chrome :
// "https://chromewebstore.google.com/detail/<slug>/<id>").

export type StoreNavigateur = {
  id: "chrome" | "edge" | "firefox" | "safari";
  nom: string;
  /** URL publique de la fiche, ou `null` tant qu'elle n'y est pas publiée. */
  url: string | null;
};

export const STORES_EXTENSION: StoreNavigateur[] = [
  { id: "chrome", nom: "Chrome", url: null },
  { id: "edge", nom: "Edge", url: null },
  { id: "firefox", nom: "Firefox", url: null },
  { id: "safari", nom: "Safari", url: null },
];

// Chemin de la page qui présente l'extension. Une vraie page (et pas une
// simple ancre `/#extension`) parce qu'un organisateur connecté est redirigé
// depuis "/" vers "/compte" (voir CLAUDE.md > "Redirection automatique vers
// /compte") : les liens depuis l'espace connecté — le formulaire d'ajout de
// cadeau — doivent pointer vers une page qu'il peut réellement atteindre. La
// page d'accueil garde par ailleurs une section `#extension` identique pour
// les visiteurs anonymes.
export const CHEMIN_EXTENSION = "/extension";
