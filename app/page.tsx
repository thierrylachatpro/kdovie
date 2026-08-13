export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-corail">
        <div className="h-5 w-5 rounded-full bg-creme" />
      </div>
      <h1 className="font-heading text-3xl font-bold text-corail">kdovie</h1>
      <p className="mt-3 max-w-sm text-sm text-gris">
        La liste de cadeaux qui suit vos événements. Un compte, tous vos
        événements, une cagnotte pour chaque cadeau.
      </p>
      <span className="mt-8 rounded-lg bg-jaune px-5 py-2.5 text-sm font-medium text-corail-dark">
        Créer ma liste
      </span>
    </main>
  );
}
