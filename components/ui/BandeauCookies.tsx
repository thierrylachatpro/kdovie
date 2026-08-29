"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ecrireConsentement,
  lireConsentement,
  mettreAJourConsentementGtag,
  OUVRIR_PREFERENCES_COOKIES_EVENT,
  type ConsentementAnalytics,
} from "@/lib/consent";

// Bandeau de consentement Google Analytics (via GTM) — voir CLAUDE.md >
// "Google Analytics 4, bandeau de consentement et Search Console". Monté
// une seule fois dans app/layout.tsx. Affiché tant qu'aucun choix n'est
// enregistré ; rouvrable à tout moment via "Gérer les cookies"
// (LiensLegaux) grâce à l'événement OUVRIR_PREFERENCES_COOKIES_EVENT.
//
// "Accepter" en corail (couleur principale) et "Refuser" en retrait, mais
// tous deux de même taille et aussi facilement cliquables l'un que l'autre
// (aucune case précochée, "Refuser" jamais réduit à un simple lien) —
// respecte l'exigence CNIL sur le fond (refuser doit être aussi simple
// qu'accepter) sans imposer une identité de couleur stricte entre les deux.
export default function BandeauCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleOuvrir() {
      setVisible(true);
    }
    window.addEventListener(OUVRIR_PREFERENCES_COOKIES_EVENT, handleOuvrir);

    // Lecture du consentement déjà enregistré différée dans un callback
    // (plutôt qu'un setState synchrone en tête d'effet) — évite
    // react-hooks/set-state-in-effect, même pattern que StatutLien.tsx et
    // RechercheVille.tsx ailleurs dans ce projet. Délai négligeable (0 ms),
    // sans incidence perceptible sur l'affichage du bandeau.
    const timeout = setTimeout(() => {
      const consentement = lireConsentement();
      setVisible(consentement === null);
      // Retour d'un choix déjà enregistré (ex. rechargement de page après
      // acceptation) : on met à jour gtag sans attendre une nouvelle
      // interaction, pour que la mesure reprenne dès que possible.
      if (consentement) {
        mettreAJourConsentementGtag(consentement);
      }
    }, 0);

    return () => {
      window.removeEventListener(OUVRIR_PREFERENCES_COOKIES_EVENT, handleOuvrir);
      clearTimeout(timeout);
    };
  }, []);

  function choisir(valeur: ConsentementAnalytics) {
    ecrireConsentement(valeur);
    mettreAJourConsentementGtag(valeur);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Préférences de cookies"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-start px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="w-full max-w-[640px] rounded-[24px] border-2 border-[#F2DFC9] bg-creme p-5.5 sm:p-6.5">
        <p className="mb-4 text-[15px] leading-relaxed text-[#5C4436]">
          Nous aimerions mesurer la fréquentation de Kdovie avec Google Analytics, uniquement si
          vous l&apos;acceptez.{" "}
          <Link
            href="/politique-de-confidentialite"
            className="font-semibold text-[#4A3529] underline hover:text-corail"
          >
            En savoir plus
          </Link>
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => choisir("refuse")}
            className="rounded-full border-2 border-[#F2DFC9] bg-white px-6 py-3 font-heading text-[15px] font-bold text-[#4A3529] hover:bg-[#FDEDE6]"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => choisir("accepte")}
            className="rounded-full border-2 border-corail bg-corail px-6 py-3 font-heading text-[15px] font-bold text-creme hover:bg-[#D45F37]"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
