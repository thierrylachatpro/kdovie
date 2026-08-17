import Link from "next/link";

export default function ListeNotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-[1] bg-sauge" />
      </div>

      <header className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-5 px-6 py-5 sm:px-10">
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
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-2xl font-bold tracking-tight text-corail">
              kdovie
            </span>
            <span className="text-[13px] text-[#8A7263]">Un seul compte, toute une vie de cadeaux</span>
          </span>
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-6 pt-6 pb-20 sm:px-10">
        <section className="mt-6 rounded-[32px] border-2 border-[#F2DFC9] bg-white px-10 py-16 text-center">
          <div className="mx-auto mb-5.5 flex h-18 w-18 items-center justify-center rounded-[24px] bg-[#F7E7D6] text-3xl">
            🔗
          </div>
          <h1 className="font-heading text-[34px] font-bold text-[#C0512A]">
            Cette liste est introuvable
          </h1>
          <p className="mx-auto mt-3 mb-7 max-w-[460px] text-[17px] leading-relaxed text-[#7A6354]">
            Le lien est peut-être incomplet, ou la liste a été supprimée par son organisateur.
            Vérifiez le lien reçu, ou demandez-lui de vous le renvoyer.
          </p>
          <Link
            href="/"
            className="font-heading inline-block rounded-2xl bg-corail px-6.5 py-4 text-base font-bold text-creme hover:bg-[#D45F37]"
          >
            Découvrir Kdovie
          </Link>
        </section>
      </main>

      <footer className="bg-[#F7E7D6] px-6 py-6.5 sm:px-10">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-6 text-sm text-[#8A7263]">
          <span>© 2026 kdovie</span>
          <nav className="flex flex-wrap items-center gap-6">
            <a href="#" className="hover:text-corail">
              Aide
            </a>
            <a href="#" className="hover:text-corail">
              Contact
            </a>
            <Link href="/" className="hover:text-corail">
              Créer ma propre liste
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
