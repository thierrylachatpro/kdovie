import { hostnameFromUrl } from "@/lib/url";

// Génère le lien affilié quand le domaine correspond à un programme connu,
// calculé à chaque affichage — jamais stocké en base, voir CLAUDE.md >
// "Liens d'affiliation (tâche #19)". Repli sur l'URL d'origine, sans
// erreur, si AMAZON_ASSOCIATE_TAG n'est pas configurée ou si le domaine
// n'est pas reconnu. Amazon Associates uniquement pour l'instant
// (amazon.fr) ; Awin (Fnac et consorts) et les autres places Amazon sont
// hors périmètre — voir la fonction comme un point d'extension, pas une
// liste figée.
export function getAffiliateLink(sourceUrl: string): string {
  const tag = process.env.AMAZON_ASSOCIATE_TAG;
  if (!tag) return sourceUrl;

  if (hostnameFromUrl(sourceUrl) !== "amazon.fr") return sourceUrl;

  const url = new URL(sourceUrl);
  url.searchParams.set("tag", tag);
  return url.toString();
}
