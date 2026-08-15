export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <svg
        className="mb-6 h-14 w-14"
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
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
