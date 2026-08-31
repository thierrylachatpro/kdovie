import Link from "next/link";
import StatutLien from "@/components/ui/StatutLien";

// En-tête unifié pour un organisateur connecté, sur toutes les pages du
// site — voir CLAUDE.md > "En-tête unifié pour les organisateurs connectés
// + page Contact" et "Recherche déplacée dans l'en-tête connecté" (31 août
// 2026, ajoute "Chercher une liste" en premier). Toujours exactement ces
// trois liens, dans cet ordre, jamais masqués même sur la page qu'ils
// désignent. Rendu null si déconnecté : chaque page affiche NavAnonyme à
// la place dans ce cas.
export default function NavConnecte({
  estConnecte,
  pseudo,
}: {
  estConnecte: boolean;
  pseudo?: string | null;
}) {
  if (!estConnecte) return null;

  const initiales = pseudo ? pseudo.slice(0, 2).toUpperCase() : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/recherche"
        className="rounded-2xl px-4 py-2.5 text-[15px] font-semibold text-[#5C4436] hover:bg-[#F7E7D6]"
      >
        Chercher une liste
        <StatutLien />
      </Link>
      <Link
        href="/compte"
        className="rounded-2xl px-4 py-2.5 text-[15px] font-semibold text-[#5C4436] hover:bg-[#F7E7D6]"
      >
        Mes listes
        <StatutLien />
      </Link>
      <Link
        href="/compte/profil"
        className="inline-flex items-center gap-2.5 rounded-2xl bg-corail py-[7px] pr-4 pl-[7px] hover:bg-[#D45F37]"
      >
        <span className="font-heading flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] bg-creme text-[15px] font-bold text-corail">
          {initiales}
        </span>
        <span className="font-heading text-[15px] font-bold text-creme">
          {pseudo || "Mon compte"}
        </span>
        <StatutLien variant="dark" />
      </Link>
    </div>
  );
}
