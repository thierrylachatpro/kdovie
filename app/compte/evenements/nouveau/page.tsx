import NouvelEvenementForm from "@/components/evenements/NouvelEvenementForm";

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
  const erreur =
    typeof erreurParam === "string" ? MESSAGES_ERREUR[erreurParam] : null;

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold text-corail">
        Nouvelle liste
      </h1>
      {erreur && <p className="text-sm text-corail-dark">{erreur}</p>}
      <NouvelEvenementForm />
    </main>
  );
}
