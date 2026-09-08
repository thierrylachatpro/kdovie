import { STORES_EXTENSION, type StoreNavigateur } from "@/lib/extensions";

// Section de présentation de l'extension navigateur — utilisée à la fois sur
// la page d'accueil (juste avant le pied de page, pour les visiteurs
// anonymes) et sur la page dédiée /extension (atteignable aussi par un
// organisateur connecté). Voir CLAUDE.md > "Extension navigateur Chrome".
// Aucun état : composant neutre, rendu côté serveur sur /extension et côté
// client quand il est inclus dans AccueilClient.

const AVANTAGES = [
  "Fonctionne même sur les sites qui bloquent la récupération par lien (Fnac, Décathlon, Sephora…).",
  "Un clic sur l'icône : le titre, le prix et la photo sont lus sur la page que vous avez sous les yeux.",
  "Vous choisissez la liste, le cadeau s'ajoute aussitôt, en tête.",
];

function BoutonStore({ nom, url }: Pick<StoreNavigateur, "nom" | "url">) {
  if (!url) {
    return (
      <span className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#F2DFC9] bg-white px-4 py-2.5 text-[15px] font-semibold text-[#8A7263]">
        {nom}
        <span className="rounded-full bg-[#F7E7D6] px-2 py-0.5 text-[12px] font-semibold text-[#7A5A16]">
          Bientôt
        </span>
      </span>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-4 py-2.5 text-[15px] font-bold text-creme hover:bg-[#D45F37]"
    >
      Ajouter à {nom}
    </a>
  );
}

export default function PresentationExtension() {
  return (
    <section
      id="extension"
      className="mx-auto max-w-[1180px] scroll-mt-24 px-6 py-16 sm:px-10 sm:py-20"
    >
      <div className="grid items-center gap-10 overflow-hidden rounded-[36px] border-2 border-[#F2DFC9] bg-white p-8 sm:p-12 md:grid-cols-2">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#EEF3EC] px-3.5 py-2 text-sm font-semibold text-sauge-dark">
            Extension navigateur
          </div>
          <h2 className="font-heading text-3xl leading-tight font-bold text-[#C0512A] sm:text-4xl">
            Ajoutez un cadeau depuis n&apos;importe quel site
          </h2>
          <p className="mt-4 mb-6 text-lg leading-relaxed text-[#5C4436]">
            Sur certaines boutiques, la récupération par lien échoue (protection
            anti-robot, page qui se charge en JavaScript…). L&apos;extension Kdovie
            lit la page directement dans votre navigateur — vous ne quittez jamais
            le site du marchand.
          </p>
          <ul className="mb-7 flex flex-col gap-2.5">
            {AVANTAGES.map((avantage) => (
              <li key={avantage} className="flex gap-3 text-base text-[#5C4436]">
                <span className="mt-2 h-2.5 w-2.5 flex-none rounded-[4px] bg-jaune" />
                {avantage}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2.5">
            {STORES_EXTENSION.map((store) => (
              <BoutonStore key={store.id} nom={store.nom} url={store.url} />
            ))}
          </div>
          <p className="mt-4 text-sm text-[#8A7263]">
            En cours de validation sur le Chrome Web Store. Edge, Firefox et
            Safari suivront.
          </p>
        </div>

        {/* Aperçu : barre du navigateur avec l'icône de l'extension surlignée,
            et la confirmation qui en descend. Pur CSS, aucune image. */}
        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="overflow-hidden rounded-[20px] border-2 border-[#F2DFC9] bg-white shadow-[0_20px_50px_-20px_rgba(74,53,41,0.3)]">
            <div className="flex items-center gap-2 bg-[#F3E7DA] px-3.5 py-2.5">
              <span className="h-2.5 w-2.5 flex-none rounded-full bg-[#D9C4AE]" />
              <span className="h-2.5 w-2.5 flex-none rounded-full bg-[#D9C4AE]" />
              <span className="h-2.5 w-2.5 flex-none rounded-full bg-[#D9C4AE]" />
              <span className="mx-2 flex-1 truncate rounded-full bg-white px-3 py-1 text-[12px] text-[#8A7263]">
                www.amazon.fr
              </span>
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-[#FCE9DE] shadow-[0_0_0_3px_rgba(232,115,74,0.5)]">
                <svg
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
                  <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
                  <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
                  <path d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z" fill="#8BA888" />
                  <path d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z" fill="#8BA888" />
                </svg>
              </span>
            </div>
            <div className="flex flex-col gap-2.5 p-5">
              <div className="h-24 w-32 rounded-lg bg-[#EBDECF]" />
              <div className="h-3.5 w-4/5 rounded bg-[#F1E7DC]" />
              <div className="h-3.5 w-3/5 rounded bg-[#F1E7DC]" />
              <div className="h-6 w-24 rounded bg-[#E8DACB]" />
            </div>
          </div>
          <div className="absolute top-12 right-0 w-56 rounded-2xl bg-creme p-4 text-center shadow-[0_18px_40px_-12px_rgba(74,53,41,0.4)]">
            <div className="text-2xl">🎉</div>
            <div className="mt-1 text-[13px] font-semibold text-[#4A3529]">
              Cadeau ajouté à votre liste !
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
