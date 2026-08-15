"use client";

import Link from "next/link";
import { useState } from "react";

type Occasion = {
  label: string;
  kicker: string;
  title: string;
  body: string;
  listName: string;
  ideas: string[];
  tiles: { name: string; price: string; color: string }[];
};

const OCCASIONS: Occasion[] = [
  {
    label: "Naissance",
    kicker: "Naissance",
    title: "Tout pour l'arrivée du bébé",
    body: "Les proches réservent au fur et à mesure, et vous évitez de recevoir trois transats identiques.",
    listName: "Bébé Camille · mars",
    ideas: [
      "Liste séparée pour les indispensables",
      "Cagnotte pour la poussette",
      "Mode privé jusqu'à la naissance",
    ],
    tiles: [
      { name: "Gigoteuse", price: "39 €", color: "#F5E3C9" },
      { name: "Transat", price: "89 €", color: "#F7D9C9" },
      { name: "Tapis d'éveil", price: "55 €", color: "#DCE7DA" },
      { name: "Veilleuse", price: "24 €", color: "#F5E3C9" },
    ],
  },
  {
    label: "Anniversaire",
    kicker: "Anniversaire",
    title: "Des idées, enfin des vraies",
    body: "Fini le « qu'est-ce qui te ferait plaisir ? » trois jours avant. La liste répond à leur place.",
    listName: "Les 40 ans de Marc",
    ideas: [
      "Idées à tous les prix",
      "Réservation anonyme",
      "Rappel une semaine avant",
    ],
    tiles: [
      { name: "Casque audio", price: "129 €", color: "#F7D9C9" },
      { name: "Coffret vin", price: "45 €", color: "#F5E3C9" },
      { name: "Sac week-end", price: "89 €", color: "#DCE7DA" },
      { name: "Livre photo", price: "32 €", color: "#F5E3C9" },
    ],
  },
  {
    label: "Mariage",
    kicker: "Mariage",
    title: "La liste et le voyage de noces",
    body: "Objets, contributions au voyage, participation libre : tout tient sur une seule page à partager.",
    listName: "Léa & Sofiane · juin",
    ideas: [
      "Cagnotte voyage de noces",
      "Contributions libres",
      "Liste visible par vos témoins",
    ],
    tiles: [
      { name: "Service de table", price: "180 €", color: "#F5E3C9" },
      { name: "Nuit à Kyoto", price: "150 €", color: "#F7D9C9" },
      { name: "Robot cuisine", price: "299 €", color: "#DCE7DA" },
      { name: "Plaid laine", price: "69 €", color: "#F5E3C9" },
    ],
  },
  {
    label: "Noël",
    kicker: "Noël",
    title: "Toute la famille sur une page",
    body: "Chaque membre a sa liste, et personne ne voit ce qui lui est destiné. Les doublons disparaissent.",
    listName: "Noël chez les Pérez",
    ideas: [
      "Une liste par personne",
      "Surprises préservées",
      "Tirage au sort intégré",
    ],
    tiles: [
      { name: "Jeu de société", price: "35 €", color: "#DCE7DA" },
      { name: "Écharpe", price: "42 €", color: "#F7D9C9" },
      { name: "Lego", price: "59 €", color: "#F5E3C9" },
      { name: "Théière fonte", price: "48 €", color: "#F5E3C9" },
    ],
  },
  {
    label: "Pot de départ",
    kicker: "Pot de départ",
    title: "Une collecte sans le tableur",
    body: "Le bureau participe en ligne, chacun laisse un mot, et l'organisateur ne court plus après les billets.",
    listName: "Départ de Nadia",
    ideas: [
      "Participation à montant libre",
      "Mots signés par l'équipe",
      "Un seul virement à la fin",
    ],
    tiles: [
      { name: "Cagnotte équipe", price: "620 €", color: "#F7D9C9" },
      { name: "Stylo gravé", price: "75 €", color: "#F5E3C9" },
      { name: "Bon voyage", price: "200 €", color: "#DCE7DA" },
      { name: "Album souvenirs", price: "40 €", color: "#F5E3C9" },
    ],
  },
  {
    label: "Crémaillère",
    kicker: "Crémaillère",
    title: "De quoi remplir le nouveau chez-soi",
    body: "Les invités voient ce qui manque vraiment, du grille-pain aux plantes du salon.",
    listName: "Nouvel appart de Julie",
    ideas: [
      "Classé pièce par pièce",
      "Petits et gros budgets",
      "Livraison à la nouvelle adresse",
    ],
    tiles: [
      { name: "Grille-pain", price: "49 €", color: "#F5E3C9" },
      { name: "Plante verte", price: "28 €", color: "#DCE7DA" },
      { name: "Set de verres", price: "36 €", color: "#F7D9C9" },
      { name: "Lampe salon", price: "95 €", color: "#F5E3C9" },
    ],
  },
  {
    label: "Baptême",
    kicker: "Baptême",
    title: "Des cadeaux qui durent",
    body: "Souvenirs, livres, contributions à l'épargne : la liste reste consultable des années après.",
    listName: "Baptême de Gabriel",
    ideas: [
      "Cadeaux souvenirs",
      "Contribution à l'épargne",
      "Album partagé avec la famille",
    ],
    tiles: [
      { name: "Médaille", price: "120 €", color: "#F5E3C9" },
      { name: "Livre prénom", price: "26 €", color: "#DCE7DA" },
      { name: "Boîte à musique", price: "58 €", color: "#F7D9C9" },
      { name: "Timbale gravée", price: "85 €", color: "#F5E3C9" },
    ],
  },
];

const FAQS = [
  {
    question: "Mes invités doivent-ils créer un compte ?",
    answer:
      "Non. Ils ouvrent le lien, choisissent un cadeau et laissent leur prénom. C'est tout.",
  },
  {
    question: "Puis-je ajouter un cadeau de n'importe quelle boutique ?",
    answer:
      "Oui. Collez l'adresse de la page produit : Kdovie récupère la photo, le nom et le prix. Vous pouvez aussi tout saisir à la main.",
  },
  {
    question: "Est-ce que je vois qui a réservé quoi ?",
    answer:
      "Vous décidez. Par défaut les réservations vous sont cachées pour garder la surprise, et se dévoilent après l'événement.",
  },
  {
    question: "Comment fonctionne l'argent d'une cagnotte ?",
    answer:
      "Les participations sont conservées jusqu'à la date de l'événement, puis versées sur votre compte. Si la cagnotte n'aboutit pas, chacun est remboursé.",
  },
  {
    question: "Est-ce que Kdovie est gratuit ?",
    answer:
      "Créer un compte, des listes et des événements est gratuit et sans limite. Seules les cagnottes ont de faibles frais de traitement bancaire.",
  },
];

const CAGNOTTE_GOAL = 1200;

function formatEuros(montant: number) {
  return `${montant.toLocaleString("fr-FR")} €`;
}

export default function AccueilClient() {
  const [occasionIndex, setOccasionIndex] = useState(0);
  const [pot, setPot] = useState(780);
  const [backers, setBackers] = useState(5);
  const [faqOuverte, setFaqOuverte] = useState<number | null>(0);

  const occasion = OCCASIONS[occasionIndex];
  const progression = Math.min(100, Math.round((pot / CAGNOTTE_GOAL) * 100));

  function ajouterPart(montant: number) {
    setPot((p) => Math.min(CAGNOTTE_GOAL, p + montant));
    setBackers((b) => b + 1);
  }

  function reinitialiserCagnotte() {
    setPot(780);
    setBackers(5);
  }

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <header className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-6 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
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
          <span className="font-heading text-2xl font-bold tracking-tight text-corail">
            kdovie
          </span>
        </div>
        <nav className="hidden items-center gap-7 text-[15px] font-medium text-[#5C4436] md:flex">
          <a href="#comment" className="hover:text-corail">
            Comment ça marche
          </a>
          <a href="#evenements" className="hover:text-corail">
            Occasions
          </a>
          <a href="#cagnotte" className="hover:text-corail">
            Cagnotte
          </a>
          <a href="#questions" className="hover:text-corail">
            Questions
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/connexion"
            className="rounded-2xl px-4 py-2.5 text-[15px] font-semibold text-[#5C4436] hover:bg-[#F7E7D6]"
          >
            Se connecter
          </Link>
          <Link
            href="/connexion?next=/compte/evenements/nouveau"
            className="rounded-2xl bg-corail px-[22px] py-3 text-[15px] font-semibold text-creme hover:bg-[#D45F37]"
          >
            Créer ma liste
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1240px] items-center gap-14 px-6 py-12 sm:px-10 sm:py-16 md:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#F5E3C9] px-3.5 py-2 text-sm font-semibold text-[#7A5A16]">
            Un seul compte, toute une vie de cadeaux
          </div>
          <h1 className="font-heading text-4xl leading-[1.08] font-bold tracking-tight text-corail text-balance sm:text-5xl lg:text-[60px]">
            Vos listes de cadeaux, pour chaque occasion de la vie
          </h1>
          <p className="mt-5 max-w-[520px] text-lg leading-relaxed text-[#5C4436] text-pretty">
            Anniversaire, Noël, pot de départ, mariage ou naissance : créez
            votre liste, ajoutez des cadeaux depuis n&apos;importe quelle
            boutique en ligne, et laissez vos proches réserver en deux clics.
            Sans inscription pour eux.
          </p>
          <div className="mt-8 mb-7 flex flex-wrap gap-3.5">
            <Link
              href="/connexion?next=/compte/evenements/nouveau"
              className="font-heading rounded-[20px] bg-corail px-8 py-[18px] text-lg font-bold text-creme hover:bg-[#D45F37]"
            >
              Créer ma liste gratuitement
            </Link>
            <a
              href="#comment"
              className="font-heading rounded-[20px] bg-jaune px-8 py-[18px] text-lg font-bold text-[#6B4A0F] hover:bg-[#EBAB2C]"
            >
              Voir comment ça marche
            </a>
          </div>
          <div className="flex flex-wrap gap-5 text-[15px] text-[#7A6354]">
            <span>✓ Gratuit</span>
            <span>✓ Aucune inscription pour vos proches</span>
            <span>✓ Zéro doublon</span>
          </div>
        </div>

        <div className="rounded-[28px] border-2 border-[#F2DFC9] bg-white p-6">
          <div className="mb-4.5 flex items-center justify-between">
            <div>
              <div className="font-heading text-xl font-bold text-[#4A3529]">
                Naissance de Camille
              </div>
              <div className="text-sm text-[#8A7263]">
                12 cadeaux · 7 déjà réservés
              </div>
            </div>
            <div className="rounded-full bg-[#DCE7DA] px-3 py-1.5 text-[13px] font-semibold text-[#2F4A2C]">
              Liste ouverte
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3.5 rounded-[18px] bg-creme p-3.5">
              <div className="h-[52px] w-[52px] flex-none rounded-2xl bg-[#F5E3C9]" />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-[#4A3529]">
                  Gigoteuse en coton bio
                </div>
                <div className="text-[13px] text-[#8A7263]">
                  39 € · petitebete.fr
                </div>
              </div>
              <div className="flex-none rounded-full bg-[#DCE7DA] px-3 py-1.5 text-[13px] font-semibold text-[#2F4A2C]">
                Réservé
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-[18px] bg-creme p-3.5">
              <div className="h-[52px] w-[52px] flex-none rounded-2xl bg-[#F7D9C9]" />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-[#4A3529]">
                  Poussette tout-terrain
                </div>
                <div className="text-[13px] text-[#8A7263]">
                  420 € · cagnotte à 6 personnes
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#F2DFC9]">
                  <div className="h-2 w-[68%] rounded-full bg-corail" />
                </div>
              </div>
              <div className="flex-none rounded-full bg-[#F5E3C9] px-3 py-1.5 text-[13px] font-semibold text-[#7A5A16]">
                68 %
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-[18px] bg-creme p-3.5">
              <div className="h-[52px] w-[52px] flex-none rounded-2xl bg-[#DCE7DA]" />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-[#4A3529]">
                  Tapis d&apos;éveil
                </div>
                <div className="text-[13px] text-[#8A7263]">
                  55 € · lesptitsloups.com
                </div>
              </div>
              <div className="flex-none rounded-full bg-corail px-3.5 py-1.5 text-[13px] font-semibold text-creme">
                Je réserve
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="comment" className="bg-[#F7E7D6] px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-[1240px]">
          <h2 className="font-heading text-center text-3xl font-bold text-[#C0512A] sm:text-4xl">
            Trois étapes, et c&apos;est parti
          </h2>
          <p className="mx-auto mt-3 mb-12 max-w-[620px] text-center text-lg text-[#7A6354]">
            Pas de compte à créer pour vos proches, pas de tableur à
            partager, pas de cadeau en double.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                numero: 1,
                bg: "bg-corail",
                fg: "text-creme",
                titre: "Créez votre liste",
                texte:
                  "Choisissez l'occasion, la date, et donnez un nom à votre évènement. Trente secondes suffisent.",
              },
              {
                numero: 2,
                bg: "bg-jaune",
                fg: "text-[#6B4A0F]",
                titre: "Ajoutez vos cadeaux",
                texte:
                  "Collez le lien d'une boutique, n'importe laquelle : le nom, la photo et le prix se remplissent tout seuls.",
              },
              {
                numero: 3,
                bg: "bg-sauge",
                fg: "text-creme",
                titre: "Partagez le lien",
                texte:
                  "Vos proches réservent sans créer de compte. Vous, vous gardez la surprise : les réservations restent cachées.",
              },
            ].map((etape) => (
              <div
                key={etape.numero}
                className="rounded-[28px] bg-creme p-8"
              >
                <div
                  className={`font-heading mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl text-2xl font-bold ${etape.bg} ${etape.fg}`}
                >
                  {etape.numero}
                </div>
                <h3 className="font-heading mb-2.5 text-xl font-bold text-[#4A3529]">
                  {etape.titre}
                </h3>
                <p className="text-base leading-relaxed text-[#7A6354]">
                  {etape.texte}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="evenements"
        className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10 sm:py-20"
      >
        <div className="mb-9 text-center">
          <h2 className="font-heading text-3xl font-bold text-[#C0512A] sm:text-4xl">
            Un compte qui suit toute votre vie
          </h2>
          <p className="mx-auto mt-3 max-w-[640px] text-lg text-[#7A6354]">
            Vos listes restent là, avec le souvenir de qui a offert quoi.
            Vous pouvez la mettre à jour, ou supprimer des idées en 1 clic.
          </p>
        </div>
        <div className="mb-9 flex flex-wrap justify-center gap-3">
          {OCCASIONS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={index === occasionIndex}
              onClick={() => setOccasionIndex(index)}
              className={`font-heading rounded-full border-2 px-5 py-3 text-base font-semibold ${
                index === occasionIndex
                  ? "border-corail bg-corail text-creme"
                  : "border-[#F2DFC9] bg-white text-[#5C4436]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 items-center gap-8 rounded-[32px] border-2 border-[#F2DFC9] bg-white p-6 sm:p-10 md:grid-cols-2">
          <div>
            <div className="mb-2.5 text-[15px] font-semibold text-sauge">
              {occasion.kicker}
            </div>
            <h3 className="font-heading mb-3.5 text-2xl font-bold text-[#4A3529] sm:text-[30px]">
              {occasion.title}
            </h3>
            <p className="mb-5 text-[17px] leading-relaxed text-[#7A6354]">
              {occasion.body}
            </p>
            <div className="flex flex-col gap-2.5">
              {occasion.ideas.map((idee) => (
                <div
                  key={idee}
                  className="flex items-center gap-3 text-base text-[#5C4436]"
                >
                  <span className="h-2.5 w-2.5 flex-none rounded-[4px] bg-jaune" />
                  {idee}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-creme p-7">
            <div className="font-heading mb-4 text-lg font-bold text-[#4A3529]">
              {occasion.listName}
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              {occasion.tiles.map((tile) => (
                <div
                  key={tile.name}
                  className="rounded-2xl bg-white p-3.5"
                >
                  <div
                    className="mb-2.5 h-16 rounded-2xl"
                    style={{ background: tile.color }}
                  />
                  <div className="text-sm font-semibold text-[#4A3529]">
                    {tile.name}
                  </div>
                  <div className="text-[13px] text-[#8A7263]">
                    {tile.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cagnotte" className="bg-[#F7E7D6] px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-[1240px] items-center gap-14 md:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex rounded-full bg-corail px-3.5 py-2 text-sm font-semibold text-creme">
              Cagnotte fractionnée
            </div>
            <h2 className="font-heading text-3xl leading-tight font-bold text-[#C0512A] sm:text-4xl">
              Le grand cadeau, à plusieurs
            </h2>
            <p className="mt-4 mb-6 text-lg leading-relaxed text-[#5C4436]">
              Un vélo, une poussette, un voyage : chacun met ce qu&apos;il
              peut, la cagnotte se remplit toute seule. Personne n&apos;a à
              faire les comptes.
            </p>
            <div className="flex flex-col gap-3.5 text-base text-[#5C4436]">
              <div className="flex gap-3">
                <span className="font-bold text-sauge">✓</span>
                Montant libre ou parts suggérées
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-sauge">✓</span>
                Chaque participant laisse un petit mot
              </div>
              <div className="flex gap-3">
                <span className="font-bold text-sauge">✓</span>
                Vous recevez le montant crédité même si la cagnotte
                n&apos;est pas finie
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-creme p-8">
            <div className="mb-5.5 flex items-center gap-4">
              <div className="h-[72px] w-[72px] flex-none rounded-[20px] bg-[#F7D9C9]" />
              <div>
                <div className="font-heading text-xl font-bold text-[#4A3529]">
                  Vélo cargo électrique
                </div>
                <div className="text-[15px] text-[#8A7263]">
                  Objectif {formatEuros(CAGNOTTE_GOAL)}
                </div>
              </div>
            </div>
            <div className="mb-2.5 h-4 overflow-hidden rounded-full bg-[#F2DFC9]">
              <div
                className="h-4 rounded-full bg-sauge transition-[width] duration-500 ease-out"
                style={{ width: `${progression}%` }}
              />
            </div>
            <div className="mb-5.5 flex justify-between text-[15px] font-semibold text-[#5C4436]">
              <span>
                {formatEuros(pot)} collectés
              </span>
              <span className="text-[#8A7263]">{backers} participants</span>
            </div>
            <div className="mb-4.5 flex flex-wrap gap-2.5">
              {[20, 50, 100].map((montant) => (
                <button
                  key={montant}
                  type="button"
                  onClick={() => ajouterPart(montant)}
                  className="font-heading flex-1 rounded-2xl border-2 border-[#F2DFC9] bg-white px-4.5 py-3 text-[15px] font-bold text-[#5C4436]"
                >
                  + {montant} €
                </button>
              ))}
              <button
                type="button"
                onClick={reinitialiserCagnotte}
                className="font-heading rounded-2xl border-2 border-[#F2DFC9] bg-white px-4.5 py-3 text-[15px] font-bold text-[#8A7263]"
              >
                Réinitialiser
              </button>
            </div>
            <div className="text-center text-sm text-[#8A7263]">
              {pot >= CAGNOTTE_GOAL
                ? "Objectif atteint, le cadeau est offert 🎉"
                : `Il reste ${formatEuros(CAGNOTTE_GOAL - pot)} à réunir`}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10 sm:py-20">
        <h2 className="font-heading mb-10 text-center text-3xl font-bold text-[#C0512A] sm:text-4xl">
          Pensé pour toute la famille
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              bg: "bg-jaune",
              titre: "Toutes les boutiques",
              texte:
                "Un lien suffit. Grande enseigne, créateur local ou site étranger, tout entre dans la même liste.",
            },
            {
              bg: "bg-sauge",
              titre: "Invités sans compte",
              texte:
                "Vos proches cliquent, réservent, c'est fini. Ni mot de passe, ni application à installer.",
            },
            {
              bg: "bg-corail",
              titre: "Vos souvenirs gardés",
              texte:
                "Chaque liste passée reste consultable, avec qui a offert quoi. Pratique au moment des remerciements.",
            },
          ].map((feature) => (
            <div
              key={feature.titre}
              className="rounded-[28px] border-2 border-[#F2DFC9] bg-white p-7.5"
            >
              <div className={`mb-4.5 h-11 w-11 rounded-2xl ${feature.bg}`} />
              <h3 className="font-heading mb-2 text-xl font-bold text-[#4A3529]">
                {feature.titre}
              </h3>
              <p className="text-base leading-relaxed text-[#7A6354]">
                {feature.texte}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="questions"
        className="mx-auto max-w-[840px] px-6 pb-20 sm:px-10"
      >
        <h2 className="font-heading mb-8 text-center text-3xl font-bold text-[#C0512A]">
          Les questions qu&apos;on nous pose
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, index) => {
            const ouverte = faqOuverte === index;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-[22px] border-2 border-[#F2DFC9] bg-white"
              >
                <button
                  type="button"
                  aria-expanded={ouverte}
                  onClick={() =>
                    setFaqOuverte((current) =>
                      current === index ? null : index,
                    )
                  }
                  className="font-heading flex w-full items-center justify-between gap-4 px-6.5 py-5.5 text-left text-lg font-bold text-[#4A3529]"
                >
                  {faq.question}
                  <span
                    className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] bg-[#F7E7D6] text-xl text-[#C0512A] transition-transform duration-200 ease-out"
                    style={{ transform: `rotate(${ouverte ? 45 : 0}deg)` }}
                  >
                    +
                  </span>
                </button>
                {ouverte && (
                  <p className="px-6.5 pb-6 text-base leading-relaxed text-[#7A6354]">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 pb-20 sm:px-10">
        <div className="rounded-[36px] bg-corail px-8 py-16 text-center sm:px-12">
          <h2 className="font-heading text-3xl leading-tight font-bold text-creme sm:text-4xl lg:text-[44px]">
            La prochaine occasion arrive vite
          </h2>
          <p className="mx-auto mt-4 mb-8 max-w-[520px] text-lg text-[#FFE9DC]">
            Créez votre première liste en quelques minutes. C&apos;est
            gratuit, et vos proches vous diront merci.
          </p>
          <Link
            href="/connexion?next=/compte/evenements/nouveau"
            className="font-heading inline-block rounded-[22px] bg-jaune px-10 py-5 text-lg font-bold text-[#6B4A0F] hover:bg-creme hover:text-[#C0512A]"
          >
            Créer ma liste gratuitement
          </Link>
        </div>
      </section>

      <footer className="bg-[#F7E7D6] px-6 py-11 sm:px-10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <svg
              viewBox="0 0 56 56"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="block h-[30px] w-[30px]"
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
            <span className="font-heading text-lg font-bold text-corail">
              kdovie
            </span>
          </div>
          <nav className="flex flex-wrap gap-6 text-[15px] text-[#5C4436]">
            <a href="#" className="hover:text-corail">
              À propos
            </a>
            <a href="#" className="hover:text-corail">
              Aide
            </a>
            <a href="#" className="hover:text-corail">
              Confidentialité
            </a>
            <a href="#" className="hover:text-corail">
              Contact
            </a>
          </nav>
          <div className="text-sm text-[#8A7263]">© 2026 kdovie</div>
        </div>
      </footer>
    </div>
  );
}
