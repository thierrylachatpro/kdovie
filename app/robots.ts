import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

// Voir CLAUDE.md > "Audit SEO". On laisse /liste/[slug] crawlable (les pages
// portent elles-mêmes robots: noindex, follow via generateMetadata) pour ne
// pas couper la circulation du PageRank ; seules les zones privées ou à jeton
// secret sont interdites au crawl. La page /recherche est crawlable, ses
// variantes ?q=…&city=… sont noindex côté page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/compte/",
        "/admin/",
        "/api/",
        "/auth/",
        "/connexion",
        "/liste/*/annuler/",
        "/bientot-disponible",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
