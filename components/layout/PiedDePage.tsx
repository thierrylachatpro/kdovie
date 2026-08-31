import Link from "next/link";
import LiensLegaux from "@/components/layout/LiensLegaux";

// Pied de page uniformisé, réutilisé sur toutes les pages sauf l'accueil
// (AccueilClient.tsx garde son propre habillage visuel) — voir CLAUDE.md >
// "Uniformisation du pied de page + déplacement de la recherche vers
// l'en-tête". Ordre exact : © 2026 kdovie · Aide · Contact · Mentions
// légales · CGU · CGV · Confidentialité · Cookies — rien d'autre (pas de
// "Retrouver une liste" ni "Retour à l'accueil", couverts par NavConnecte/
// NavAnonyme dans l'en-tête).
export default function PiedDePage() {
  return (
    <footer className="bg-[#F7E7D6] px-6 py-6.5 sm:px-10">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 text-sm text-[#8A7263]">
        <span>© 2026 kdovie</span>
        <nav className="flex flex-wrap items-center gap-6">
          <Link href="/aide" className="hover:text-corail">
            Aide
          </Link>
          <Link href="/contact" className="hover:text-corail">
            Contact
          </Link>
          <LiensLegaux className="hover:text-corail" />
        </nav>
      </div>
    </footer>
  );
}
