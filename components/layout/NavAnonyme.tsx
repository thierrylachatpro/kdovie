import Link from "next/link";
import StatutLien from "@/components/ui/StatutLien";

// Nav publique pour un visiteur non connecté, symétrique à NavConnecte —
// voir CLAUDE.md > "Nav publique pour les visiteurs anonymes". Rendu null
// si connecté : chaque page affiche NavConnecte à la place dans ce cas,
// jamais les deux en même temps. Les liens d'ancrage pointent vers
// l'accueil en chemin absolu (/#comment...) pour fonctionner depuis
// n'importe quelle page, pas seulement l'accueil elle-même.
export default function NavAnonyme({ estConnecte }: { estConnecte: boolean }) {
  if (estConnecte) return null;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <nav className="hidden items-center gap-7 text-[15px] font-medium text-[#5C4436] md:flex">
        <Link href="/#comment" className="hover:text-corail">
          Comment ça marche
        </Link>
        <Link href="/#evenements" className="hover:text-corail">
          Occasions
        </Link>
        <Link href="/#cagnotte" className="hover:text-corail">
          Cagnotte
        </Link>
        <Link href="/#questions" className="hover:text-corail">
          Questions
        </Link>
        <Link href="/recherche" className="hover:text-corail">
          Retrouver une liste
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link
          href="/connexion"
          className="rounded-2xl bg-corail px-[22px] py-3 text-[15px] font-semibold text-creme hover:bg-[#D45F37]"
        >
          Se connecter
          <StatutLien variant="dark" />
        </Link>
      </div>
    </div>
  );
}
