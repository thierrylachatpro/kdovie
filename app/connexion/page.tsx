import ConnexionForm from "@/components/auth/ConnexionForm";

export default async function ConnexionPage({
  searchParams,
}: PageProps<"/connexion">) {
  const params = await searchParams;
  const nextParam = params.next;
  const next = typeof nextParam === "string" ? nextParam : "/compte";
  const lienInvalide = params.erreur === "lien_invalide";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="font-heading text-2xl font-bold text-corail">
        Connexion organisateur
      </h1>
      <p className="max-w-sm text-sm text-gris">
        Pas de mot de passe : indiquez votre email, vous recevrez un lien de
        connexion valable quelques minutes.
      </p>
      {lienInvalide && (
        <p className="max-w-sm text-sm text-corail-dark">
          Ce lien de connexion n&apos;est plus valable, demandez-en un nouveau.
        </p>
      )}
      <ConnexionForm next={next} />
    </main>
  );
}
