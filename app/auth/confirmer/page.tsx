import Link from "next/link";
import PageLegale from "@/components/layout/PageLegale";
import ConfirmerConnexionButton from "@/components/auth/ConfirmerConnexionButton";
import { confirmerConnexion } from "./actions";

// Étape intermédiaire entre le lien reçu par e-mail et la connexion réelle
// — exige un vrai clic sur "Me connecter" avant d'appeler verifyOtp, voir
// CLAUDE.md > "Bug lien magique grillé par un pré-scan automatique". Une
// simple visite GET de cette page (par exemple un scanner de liens côté
// client mail) n'authentifie personne : seul le clic sur le bouton
// déclenche la Server Action.
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

  if (!tokenHash || !type) {
    return (
      <PageLegale title="Lien de connexion invalide">
        <p className="text-[17px] leading-relaxed text-[#7A6354]">
          Ce lien n&apos;est plus valable ou est incomplet — demandez-en un nouveau.
        </p>
        <Link
          href="/connexion"
          className="font-heading inline-flex w-fit items-center justify-center rounded-2xl bg-corail px-6 py-3.5 text-base font-bold text-creme hover:bg-[#D45F37]"
        >
          Retour à la connexion
        </Link>
      </PageLegale>
    );
  }

  return (
    <PageLegale title="Un dernier clic pour vous connecter">
      <p className="text-[17px] leading-relaxed text-[#7A6354]">
        Pour votre sécurité, confirmez que c&apos;est bien vous qui avez demandé ce lien.
      </p>
      <form action={confirmerConnexion} className="max-w-90">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next} />
        <ConfirmerConnexionButton />
      </form>
    </PageLegale>
  );
}
