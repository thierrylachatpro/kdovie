import Link from "next/link";

// En-tête unifié pour un organisateur connecté, sur toutes les pages du
// site — voir CLAUDE.md > "En-tête unifié pour les organisateurs connectés
// + page Contact". Toujours exactement ces deux liens, dans cet ordre,
// jamais masqués même sur la page qu'ils désignent. Rendu null si
// déconnecté : chaque page garde son en-tête actuel dans ce cas (hors
// périmètre de cette unification).
export default function NavConnecte({ estConnecte }: { estConnecte: boolean }) {
  if (!estConnecte) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/compte"
        className="rounded-2xl px-4 py-2.5 text-[15px] font-semibold text-[#5C4436] hover:bg-[#F7E7D6]"
      >
        Mes listes
      </Link>
      <Link
        href="/compte/profil"
        className="rounded-2xl px-4 py-2.5 text-[15px] font-semibold text-[#5C4436] hover:bg-[#F7E7D6]"
      >
        Mon compte
      </Link>
    </div>
  );
}
