import type { Metadata } from "next";

// Constantes et helper SEO partagés — voir CLAUDE.md > "Audit SEO / fondations
// d'indexation". Chaque route publique doit avoir un title + une description
// uniques ; ce helper évite de recopier la structure openGraph/canonical.

export const SITE_NAME = "Kdovie";

export const DEFAULT_TITLE =
  "Kdovie — Listes de cadeaux et cagnottes pour tous vos événements";

export const DEFAULT_DESCRIPTION =
  "Créez votre liste de cadeaux pour un anniversaire, un mariage, une naissance ou Noël. " +
  "Vos proches réservent un cadeau ou participent à une cagnotte commune, sans créer de compte.";

/**
 * Métadonnées d'une page publique : title, description, canonical et Open Graph
 * cohérents. `path` est relatif ("/", "/aide"…) — résolu contre `metadataBase`
 * (défini dans app/layout.tsx). `noindex` pose robots: noindex, follow (le lien
 * reste suivi, on ne coupe pas la circulation du PageRank interne).
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title?: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "fr_FR",
      url: path,
      title: title ?? DEFAULT_TITLE,
      description,
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
