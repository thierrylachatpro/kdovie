import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

// Uniquement les routes publiques stables et indexables. Volontairement
// PAS de /liste/[slug] : ce sont des données personnelles, les pages sont
// noindex (voir CLAUDE.md > "Audit SEO"). Pas de /connexion, /auth/*,
// /compte/*, /admin/* non plus.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/aide", priority: 0.8, changeFrequency: "monthly" },
    { path: "/recherche", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.3, changeFrequency: "yearly" },
    { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
    { path: "/cgu", priority: 0.2, changeFrequency: "yearly" },
    { path: "/cgv", priority: 0.2, changeFrequency: "yearly" },
    { path: "/politique-de-confidentialite", priority: 0.2, changeFrequency: "yearly" },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
