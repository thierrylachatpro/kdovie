// URL de base pour les liens absolus (emails, mais aussi metadataBase /
// canonical / sitemap / robots côté SEO). kdovie.com est en ligne : c'est le
// domaine canonique. NEXT_PUBLIC_SITE_URL reste prioritaire pour surcharger
// par environnement sur Vercel (ex. un alias de preview) — à poser sur
// l'environnement dev si les emails de test ne doivent pas pointer kdovie.com.
//
// Tolérant : une valeur sans protocole ("kdovie.com", "…vercel.app") ou avec
// un slash final est normalisée, plutôt que de faire planter le build sur
// `new URL(SITE_URL)` (metadataBase).
const brut = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://kdovie.com";
const avecProtocole = /^https?:\/\//i.test(brut) ? brut : `https://${brut}`;

export const SITE_URL = avecProtocole.replace(/\/+$/, "");
