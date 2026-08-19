// Bandeau visible uniquement sur les déploiements qui ne sont pas la branche
// `main` (donc kdovie.vercel.app une fois la bascule de "branche de
// production" Vercel faite vers `dev`, ainsi que les previews de PR) — voir
// CLAUDE.md > "Environnements dev/prod séparés". VERCEL_GIT_COMMIT_REF est
// une variable système posée automatiquement par Vercel, lue ici côté
// serveur (root layout, Server Component) : jamais présente en local
// (`npm run dev`), donc pas de bandeau en développement local non plus.
// But : éviter toute confusion entre les deux environnements — les libellés
// "Production"/"Preview" côté Vercel sont contre-intuitifs dans ce montage
// (dev = "Production" au sens Vercel, main = pointe kdovie.com malgré tout).
export default function BandeauEnvironnement() {
  const branche = process.env.VERCEL_GIT_COMMIT_REF;

  if (!branche || branche === "main") return null;

  return (
    <div className="bg-[#4A3529] px-4 py-2 text-center text-[13px] font-semibold text-creme">
      Environnement de développement — branche « {branche} », pas les vraies données
    </div>
  );
}
