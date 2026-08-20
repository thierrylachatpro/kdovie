import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NouvelEvenementForm from "@/components/evenements/NouvelEvenementForm";
import LiensLegaux from "@/components/layout/LiensLegaux";
import NavConnecte from "@/components/layout/NavConnecte";

const MESSAGES_ERREUR: Record<string, string> = {
  champs_invalides: "Merci de remplir le type et le nom de la liste.",
  slug_pris: "Ce lien est déjà utilisé, modifiez-le avant de valider.",
  erreur: "Une erreur est survenue, réessayez.",
};

export default async function NouvelEvenementPage({
  searchParams,
}: PageProps<"/compte/evenements/nouveau">) {
  const params = await searchParams;
  const erreurParam = params.erreur;
  const erreur = typeof erreurParam === "string" ? MESSAGES_ERREUR[erreurParam] : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const pseudo = profile?.display_name?.trim() || user.email?.split("@")[0] || null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-[1] bg-sauge" />
      </div>

      <header className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-5 px-6 py-5 sm:px-10">
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
        <NavConnecte estConnecte={true} pseudo={pseudo} />
      </header>

      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-6 pt-4 pb-20 sm:px-10">
        <h1 className="font-heading text-[40px] leading-[1.1] font-bold text-corail">
          Nouvelle liste
        </h1>
        <p className="mt-2.5 mb-8 text-lg text-[#7A6354]">
          Un événement précis ou juste une liste d&apos;envies : vous choisissez, tout est
          modifiable ensuite.
        </p>

        {erreur && <p className="mb-4 text-sm text-corail-dark">{erreur}</p>}

        <section className="rounded-[28px] border-2 border-[#F2DFC9] bg-white p-7.5">
          <NouvelEvenementForm />
        </section>
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
            <Link href="/compte" className="hover:text-corail">
              Mes listes
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
