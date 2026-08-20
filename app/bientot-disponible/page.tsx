import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kdovie — bientôt disponible",
  robots: { index: false, follow: false },
};

// Page d'attente affichée en prod tant que MAINTENANCE_MODE=true (voir
// middleware.ts et CLAUDE.md > "Page d'attente en production"). Volontairement
// minimale et statique — pas de logique, pas de formulaire.
export default function BientotDisponiblePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-creme px-6 text-center">
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="mb-6 h-16 w-16"
      >
        <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
        <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
        <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
        <path
          d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z"
          fill="#8BA888"
        />
        <path
          d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z"
          fill="#8BA888"
        />
      </svg>

      <span className="font-heading mb-3 text-3xl font-bold tracking-tight text-corail">
        kdovie
      </span>

      <h1 className="font-heading mb-4 max-w-md text-2xl leading-tight font-bold text-[#4A3529] sm:text-3xl">
        On prépare quelque chose de sympa
      </h1>

      <p className="max-w-md text-[17px] leading-relaxed text-[#7A6354]">
        La plateforme de listes de cadeaux qui vous suit toute une vie arrive très bientôt.
        On revient vite.
      </p>

      <a
        href="mailto:contact@kdovie.com"
        className="mt-8 text-[15px] text-[#8A7263] underline underline-offset-2 hover:text-corail"
      >
        contact@kdovie.com
      </a>
    </div>
  );
}
