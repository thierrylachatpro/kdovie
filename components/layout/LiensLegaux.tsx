"use client";

import Link from "next/link";
import { ouvrirPreferencesCookies } from "@/lib/consent";

// Liens légaux, liés depuis le pied de page sur tout le site — voir
// CLAUDE.md > "Pages légales : mentions légales, CGU, CGV", "Politique de
// confidentialité RGPD" et "Uniformisation du pied de page" (31 août 2026,
// libellé raccourci en "Cookies"). Ce bouton rouvre le bandeau de
// consentement (BandeauCookies, monté dans app/layout.tsx) via un événement
// DOM plutôt qu'un état React partagé — les deux composants n'ont pas de
// parent commun plus proche que le layout racine.
export default function LiensLegaux({ className }: { className?: string }) {
  return (
    <>
      <Link href="/mentions-legales" className={className}>
        Mentions légales
      </Link>
      <Link href="/cgu" className={className}>
        CGU
      </Link>
      <Link href="/cgv" className={className}>
        CGV
      </Link>
      <Link href="/politique-de-confidentialite" className={className}>
        Confidentialité
      </Link>
      <button
        type="button"
        onClick={ouvrirPreferencesCookies}
        className={`cursor-pointer border-0 bg-transparent p-0 ${className ?? ""}`}
      >
        Cookies
      </button>
    </>
  );
}
