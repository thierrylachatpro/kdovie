// Consentement analytics (Google Consent Mode via GTM) — voir CLAUDE.md >
// "Google Analytics 4, bandeau de consentement et Search Console". Le shim
// gtag() est posé par le script inline "beforeInteractive" de app/layout.tsx,
// avant même le chargement du conteneur GTM — toujours défini au moment où
// ce module s'exécute côté client (jamais côté serveur, cf. les gardes
// `typeof window` ci-dessous).
export const CONSENT_STORAGE_KEY = "kdovie_consentement_analytics";

// Événement DOM générique : permet au lien "Gérer les cookies" (LiensLegaux,
// présent sur une dizaine de pages) de rouvrir le bandeau (BandeauCookies,
// monté une seule fois dans app/layout.tsx) sans avoir à faire remonter un
// état React à travers tout l'arbre — les deux composants n'ont pas de
// parent commun plus proche que le layout racine.
export const OUVRIR_PREFERENCES_COOKIES_EVENT = "kdovie:ouvrir-preferences-cookies";

export type ConsentementAnalytics = "accepte" | "refuse";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function lireConsentement(): ConsentementAnalytics | null {
  if (typeof window === "undefined") return null;
  const valeur = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  return valeur === "accepte" || valeur === "refuse" ? valeur : null;
}

export function ecrireConsentement(valeur: ConsentementAnalytics): void {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, valeur);
}

export function mettreAJourConsentementGtag(valeur: ConsentementAnalytics): void {
  window.gtag?.("consent", "update", {
    analytics_storage: valeur === "accepte" ? "granted" : "denied",
  });
}

export function ouvrirPreferencesCookies(): void {
  window.dispatchEvent(new Event(OUVRIR_PREFERENCES_COOKIES_EVENT));
}
