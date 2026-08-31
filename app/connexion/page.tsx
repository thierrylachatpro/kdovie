import Link from "next/link";
import ConnexionForm from "@/components/auth/ConnexionForm";
import NavAnonyme from "@/components/layout/NavAnonyme";
import NavConnecte from "@/components/layout/NavConnecte";
import PiedDePage from "@/components/layout/PiedDePage";
import { createClient } from "@/lib/supabase/server";

export default async function ConnexionPage({
  searchParams,
}: PageProps<"/connexion">) {
  const params = await searchParams;
  const nextParam = params.next;
  const next = typeof nextParam === "string" ? nextParam : "/compte";
  const lienInvalide = params.erreur === "lien_invalide";
  const compteDesactive = params.erreur === "compte_desactive";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const estConnecte = Boolean(user);

  let pseudo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    pseudo = profile?.first_name?.trim() || user.email?.split("@")[0] || null;
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-1 bg-sauge" />
      </div>

      <header className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-5 px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <svg
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="block h-9 w-9"
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
            <span className="text-[13px] text-[#8A7263]">
              Un seul compte, toute une vie de cadeaux
            </span>
          </span>
        </Link>
        <NavConnecte estConnecte={estConnecte} pseudo={pseudo} />
        <NavAnonyme estConnecte={estConnecte} />
      </header>

      <main className="mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-16 px-6 py-6 sm:px-10 sm:py-10 md:grid-cols-2">
        <aside className="hidden md:block">
          <div className="rounded-[36px] bg-[#F7E7D6] p-10">
            <h2 className="font-heading text-[34px] leading-tight font-bold text-[#C0512A]">
              Content de vous revoir
            </h2>
            <p className="mt-4 mb-7 text-lg leading-relaxed text-[#5C4436]">
              Vos listes, passées ou en cours, et vos cagnottes vous attendent au même
              endroit.
            </p>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-3.5 rounded-[20px] bg-creme p-4">
                <div className="h-[42px] w-[42px] flex-none rounded-2xl bg-jaune" />
                <div>
                  <div className="font-heading text-base font-bold text-[#4A3529]">
                    Noël chez les Pérez
                  </div>
                  <div className="text-sm text-[#8A7263]">
                    3 nouvelles réservations
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3.5 rounded-[20px] bg-creme p-4">
                <div className="h-[42px] w-[42px] flex-none rounded-2xl bg-sauge" />
                <div>
                  <div className="font-heading text-base font-bold text-[#4A3529]">
                    Cagnotte vélo cargo
                  </div>
                  <div className="text-sm text-[#8A7263]">
                    780 € sur 1 200 € réunis
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-5 px-1 text-[15px] text-[#8A7263]">
            Vous venez réserver un cadeau ? Pas besoin de compte : ouvrez
            simplement le lien qu&apos;on vous a envoyé.
          </p>
        </aside>

        <div className="mx-auto w-full max-w-[480px]">
          <h1 className="font-heading text-3xl font-bold text-corail sm:text-4xl">
            Se connecter
          </h1>
          <p className="mt-2 mb-7 text-[17px] leading-relaxed text-[#7A6354]">
            Indiquez votre e-mail : nous vous envoyons un lien de connexion.
            Aucun mot de passe à retenir.
          </p>

          <ConnexionForm next={next} lienInvalide={lienInvalide} compteDesactive={compteDesactive} />

          <p className="mt-6 text-sm leading-relaxed text-[#8A7263]">
            En vous connectant, vous acceptez nos{" "}
            <Link href="/cgu" className="underline">
              conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link href="/mentions-legales#donnees-personnelles" className="underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </main>

      <PiedDePage />
    </div>
  );
}
