// URL de base pour les liens absolus (emails, mais aussi metadataBase /
// canonical / sitemap / robots côté SEO). kdovie.com est en ligne : c'est le
// domaine canonique. NEXT_PUBLIC_SITE_URL reste prioritaire pour surcharger
// par environnement sur Vercel (ex. un alias de preview) — à poser sur
// l'environnement dev si les emails de test ne doivent pas pointer kdovie.com.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kdovie.com";
