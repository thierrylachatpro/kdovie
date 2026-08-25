"use client";

import { useState, useTransition, type FormEvent } from "react";
import { updateIdentite } from "@/app/compte/profil/actions";
import { initiales } from "@/lib/initials";
import RechercheVille from "@/components/ui/RechercheVille";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

// Remplace PseudoCard (profiles.display_name) — voir CLAUDE.md >
// "Recherche publique d'organisateurs par nom et ville". Le prénom
// remplace le pseudo partout où il apparaissait ; nom + ville
// n'apparaissent que dans les résultats de /recherche, jamais ailleurs.
export default function IdentiteCard({
  email,
  initialFirstName,
  initialLastName,
  initialPostalCode,
  initialCity,
  initialSearchable,
  fallbackDisplayName,
  dateCreation,
}: {
  email: string;
  initialFirstName: string;
  initialLastName: string;
  initialPostalCode: string;
  initialCity: string;
  initialSearchable: boolean;
  fallbackDisplayName: string;
  dateCreation: string | null;
}) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [postalCode, setPostalCode] = useState(initialPostalCode);
  const [city, setCity] = useState(initialCity);
  const [searchable, setSearchable] = useState(initialSearchable);
  const [saved, setSaved] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty =
    firstName !== initialFirstName ||
    lastName !== initialLastName ||
    postalCode !== initialPostalCode ||
    city !== initialCity ||
    searchable !== initialSearchable;

  const nomAffiche = firstName.trim() || fallbackDisplayName;
  const villeManquante = searchable && (!lastName.trim() || !postalCode.trim() || !city.trim());

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setErreur(null);

    if (!firstName.trim()) {
      setErreur("Le prénom est obligatoire.");
      return;
    }
    if (villeManquante) {
      setErreur("Pour être trouvable, indiquez aussi votre nom et votre ville.");
      return;
    }

    startTransition(async () => {
      const result = await updateIdentite({
        firstName,
        lastName,
        postalCode,
        city,
        searchable,
      });
      if (result.error) {
        setErreur(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <section className="rounded-[28px] border-2 border-[#F2DFC9] bg-white p-7.5">
      <div className="mb-7 flex items-center gap-4.5">
        <span className="font-heading flex h-16 w-16 flex-none items-center justify-center rounded-[22px] bg-corail text-2xl font-bold text-creme">
          {initiales(nomAffiche)}
        </span>
        <div>
          <div className="font-heading text-[22px] font-bold text-[#4A3529]">{nomAffiche}</div>
          {dateCreation && (
            <div className="text-[15px] text-[#8A7263]">Compte créé en {dateCreation}</div>
          )}
        </div>
      </div>

      <div className="mb-6.5 flex flex-col gap-2">
        <span className="font-heading text-base font-bold text-[#4A3529]">Adresse e-mail</span>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4">
          <span className="text-[17px] text-[#5C4436]">{email}</span>
          <span className="rounded-full bg-[#DCE7DA] px-3 py-1.5 text-[13px] font-semibold text-[#2F4A2C]">
            Sert à vous connecter
          </span>
        </div>
        <span className="text-sm text-[#8A7263]">
          Elle ne peut pas être modifiée pour l&apos;instant. Écrivez-nous si vous devez en
          changer.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="font-heading text-base font-bold text-[#4A3529]">Prénom</span>
            <input
              type="text"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                setSaved(false);
              }}
              placeholder="Thierry"
              className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
            />
            <span className="text-sm text-[#8A7263]">Visible par vos invités sur vos listes.</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-heading text-base font-bold text-[#4A3529]">
              Nom <span className="text-sm font-medium text-[#8A7263]">— facultatif</span>
            </span>
            <input
              type="text"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                setSaved(false);
              }}
              placeholder="Lachat"
              className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
            />
            <span className="text-sm text-[#8A7263]">
              Jamais affiché sur vos listes, uniquement dans la recherche publique.
            </span>
          </label>
        </div>

        <div>
          <RechercheVille
            initialPostalCode={initialPostalCode}
            initialCity={initialCity}
            onChange={({ postalCode: pc, city: c }) => {
              setPostalCode(pc);
              setCity(c);
              setSaved(false);
            }}
          />
          <span className="mt-1.5 block text-sm text-[#8A7263]">
            Uniquement nécessaire si vous activez la recherche publique ci-dessous.
          </span>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-[18px] bg-[#F7E7D6] p-4.5">
          <input
            type="checkbox"
            checked={searchable}
            onChange={(event) => {
              setSearchable(event.target.checked);
              setSaved(false);
            }}
            className="mt-1 h-5 w-5 flex-none accent-corail"
          />
          <span>
            <span className="font-heading block text-base font-bold text-[#4A3529]">
              Me rendre trouvable dans la recherche publique
            </span>
            <span className="text-sm text-[#7A6354]">
              Votre prénom, votre nom et votre ville deviennent visibles pour toute personne qui
              vous cherche sur Kdovie — pratique pour qu&apos;un proche retrouve vos listes sans
              lien direct.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3.5">
          <button
            type="submit"
            disabled={!dirty || isPending}
            className={`font-heading inline-flex items-center gap-2.5 rounded-2xl px-6.5 py-4 text-[17px] font-bold ${
              dirty && !isPending
                ? "cursor-pointer bg-corail text-creme hover:bg-[#D45F37]"
                : "cursor-default bg-[#F2DFC9] text-[#A08D7E]"
            }`}
          >
            {isPending && <KdovieSpinner className="h-4.5 w-4.5" />}
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && (
            <span className="rounded-full bg-[#DCE7DA] px-4 py-2.5 text-[15px] font-semibold text-[#2F4A2C]">
              Enregistré
            </span>
          )}
          {erreur && <span className="text-sm text-corail-dark">{erreur}</span>}
        </div>
      </form>
    </section>
  );
}
