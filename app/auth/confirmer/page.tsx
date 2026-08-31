import Link from "next/link";
import NavAnonyme from "@/components/layout/NavAnonyme";
import NavConnecte from "@/components/layout/NavConnecte";
import PiedDePage from "@/components/layout/PiedDePage";
import ConfirmerConnexionButton from "@/components/auth/ConfirmerConnexionButton";
import { createClient } from "@/lib/supabase/server";
import { confirmerConnexion } from "./actions";

// Étape intermédiaire entre le lien reçu par e-mail et la connexion réelle
// — exige un vrai clic sur "Me connecter" avant d'appeler verifyOtp, voir
// CLAUDE.md > "Bug lien magique grillé par un pré-scan automatique". Une
// simple visite GET de cette page (par exemple un scanner de liens côté
// client mail) n'authentifie personne : seul le clic sur le bouton
// déclenche la Server Action. Mise en page "moment" (carte centrée),
// reprise de /liste/[slug]/annuler/[reservationId] — voir CLAUDE.md >
// "Refonte visuelle de la page /auth/confirmer".
export default async function AuthConfirmerPage({
  searchParams,
}: PageProps<"/auth/confirmer">) {
  const params = await searchParams;
  const tokenHashParam = params.token_hash;
  const typeParam = params.type;
  const nextParam = params.next;

  const tokenHash = typeof tokenHashParam === "string" ? tokenHashParam : null;
  const type = typeof typeParam === "string" ? typeParam : null;
  const next = typeof nextParam === "string" ? nextParam : "/compte";

  const lienValide = Boolean(tokenHash && type);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <NavConnecte estConnecte={Boolean(user)} pseudo={pseudo} />
        <NavAnonyme estConnecte={Boolean(user)} />
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 pt-6 pb-20 sm:px-10">
        <section className="mt-6 rounded-[32px] border-2 border-[#F2DFC9] bg-white px-10 py-16 text-center">
          {lienValide ? (
            <>
              <div className="mx-auto mb-5.5 flex h-18 w-18 items-center justify-center rounded-[24px] bg-[#F7E7D6] text-3xl">
                👋
              </div>
              <h1 className="font-heading text-[28px] font-bold text-[#4A3529]">
                Plus qu&apos;un clic !
              </h1>
              <p className="mx-auto mt-3 mb-7 max-w-[380px] text-[16px] leading-relaxed text-[#7A6354]">
                Votre lien est bien arrivé. Cliquez ci-dessous pour rejoindre votre compte Kdovie.
              </p>
              <form action={confirmerConnexion}>
                <input type="hidden" name="token_hash" value={tokenHash!} />
                <input type="hidden" name="type" value={type!} />
                <input type="hidden" name="next" value={next} />
                <ConfirmerConnexionButton />
              </form>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5.5 flex h-18 w-18 items-center justify-center rounded-[24px] bg-[#F7E7D6] text-3xl">
                🔗
              </div>
              <h1 className="font-heading text-[28px] font-bold text-[#C0512A]">
                Ce lien ne fonctionne plus
              </h1>
              <p className="mx-auto mt-3 mb-7 max-w-[380px] text-[16px] leading-relaxed text-[#7A6354]">
                Il a peut-être déjà été utilisé, ou il a expiré — demandez-en un nouveau, ça ne
                prend qu&apos;un instant.
              </p>
              <Link
                href="/connexion"
                className="font-heading inline-block rounded-2xl bg-corail px-6.5 py-4 text-base font-bold text-creme hover:bg-[#D45F37]"
              >
                Retour à la connexion
              </Link>
            </>
          )}
        </section>
      </main>

      <PiedDePage />
    </div>
  );
}
