// URL de base pour les liens absolus dans les emails (pas de contexte de
// requête disponible partout, contrairement aux pages où on dérive le host
// via headers()). https://kdovie.com pas encore pointé — à ajuster via
// NEXT_PUBLIC_SITE_URL sur Vercel le moment venu, sans changement de code.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kdovie.vercel.app";
