import type { ReactNode } from "react";
import Link from "next/link";
import LiensLegaux from "@/components/layout/LiensLegaux";
import NavConnecte from "@/components/layout/NavConnecte";

// Ossature commune aux pages "sobres" (mentions légales, CGU, CGV, Aide,
// Contact) — voir CLAUDE.md > "Pages légales : mentions légales, CGU, CGV"
// et "En-tête unifié pour les organisateurs connectés + page Contact".
export default function PageLegale({
  title,
  estConnecte = false,
  pseudo = null,
  children,
}: {
  title: string;
  estConnecte?: boolean;
  pseudo?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-[1] bg-sauge" />
      </div>

      <header className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <svg
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="block h-[38px] w-[38px]"
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
          <span className="font-heading text-2xl font-bold tracking-tight text-corail">
            kdovie
          </span>
        </Link>
        <NavConnecte estConnecte={estConnecte} pseudo={pseudo} />
      </header>

      <main className="mx-auto w-full max-w-[720px] flex-1 px-6 pt-4 pb-20 sm:px-10">
        <h1 className="font-heading mb-8 text-[36px] leading-[1.15] font-bold text-corail">
          {title}
        </h1>
        <div className="flex flex-col gap-6">{children}</div>
      </main>

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
            <Link href="/recherche" className="hover:text-corail">
              Retrouver une liste
            </Link>
            <Link href="/" className="hover:text-corail">
              Retour à l&apos;accueil
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
