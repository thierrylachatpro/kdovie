import { slugify } from "@/lib/slug";

// Liens courts kdovie.com/kdo/{alias} — voir CLAUDE.md > "Liens courts
// mémorisables". Fonctions pures, partagées entre la création de liste, la
// carte de visibilité (saisie en direct), l'action serveur et le script de
// rattrapage.

export const ALIAS_MIN = 3;
export const ALIAS_MAX = 40;
export const ALIAS_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const REPLI = "ma-liste";

const MOT_DU_TYPE: Record<string, string> = {
  naissance: "naissance",
  anniversaire: "anniversaire",
  mariage: "mariage",
  noel: "noel",
  pot_depart: "depart",
  cremaillere: "cremaillere",
  bapteme: "bapteme",
};

// « Mariage d'Emma & Lucas ! » → « mariage-d-emma-lucas ».
export function normalizeAlias(saisie: string): string {
  return slugify(saisie).slice(0, ALIAS_MAX).replace(/-+$/g, "");
}

export function isValidAlias(alias: string): boolean {
  return alias.length >= ALIAS_MIN && alias.length <= ALIAS_MAX && ALIAS_REGEX.test(alias);
}

export function suggestAlias({
  firstName,
  type,
  name,
}: {
  firstName: string | null | undefined;
  type: string | null | undefined;
  name: string;
}): string {
  const prenom = firstName?.trim();
  const mot = type ? MOT_DU_TYPE[type] : undefined;
  const base = prenom && mot ? normalizeAlias(`${prenom} ${mot}`) : normalizeAlias(name);
  return isValidAlias(base) ? base : REPLI;
}

// Candidats en cas de collision : base-{année}, puis base-2, base-3…
// Chaque candidat est recoupé à 40 caractères en gardant le suffixe.
export function aliasVariants(baseSaisie: string, annee: number, nombre = 5): string[] {
  // « julie-noel-2026 » déjà pris → variantes de « julie-noel » plutôt que
  // « julie-noel-2026-2026 ».
  const sansNumero = baseSaisie.replace(/-\d+$/, "");
  const base = sansNumero.length >= ALIAS_MIN ? sansNumero : baseSaisie;
  const avecSuffixe = (suffixe: string) => {
    const tete = base.slice(0, ALIAS_MAX - suffixe.length - 1).replace(/-+$/g, "");
    return `${tete}-${suffixe}`;
  };
  const variantes = [avecSuffixe(String(annee))];
  for (let i = 2; variantes.length < nombre + 1; i++) variantes.push(avecSuffixe(String(i)));
  return variantes.filter((v) => v !== baseSaisie);
}

// Année de l'événement si renseignée (« 2026-12-24 »), sinon année courante.
export function anneeAlias(eventDate: string | null | undefined): number {
  const annee = eventDate ? Number(eventDate.slice(0, 4)) : NaN;
  return Number.isFinite(annee) && annee > 2000 ? annee : new Date().getFullYear();
}

// Normalisation pendant la frappe : comme normalizeAlias, mais garde un tiret
// final pour pouvoir taper « julie-noel » lettre par lettre. normalizeAlias
// reste appliqué à l'enregistrement.
export function normalizeAliasSaisie(saisie: string): string {
  return saisie
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/g, "")
    .slice(0, ALIAS_MAX);
}
