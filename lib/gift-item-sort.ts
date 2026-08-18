// Tri des articles, identique sur /liste/[slug] et /compte/evenements/[slug],
// voir CLAUDE.md > "Ajustements listes publique et gestion" (18 août 2026).

export type SortableGiftItem = {
  status: string;
  mode: string;
  price_cents: number | null;
  funded_amount_cents: number;
  is_priority: boolean;
};

// Groupe 1 : non réservés (réservation directe possible)
// Groupe 2 : cagnottes non démarrées (réservation directe impossible)
// Groupe 3 : cagnotte démarrée
// Groupe 4 : cagnotte finalisée
// Groupe 5 : réservés
function groupe(item: SortableGiftItem): 1 | 2 | 3 | 4 | 5 {
  if (item.status === "reserve") return 5;
  if (item.status === "cagnotte") {
    const finalisee = item.price_cents !== null && item.funded_amount_cents >= item.price_cents;
    return finalisee ? 4 : 3;
  }
  // status === "disponible"
  return item.mode === "cotisation_obligatoire" ? 2 : 1;
}

// "Terminé" = cagnotte finalisée ou article réservé — la mise en avant ne
// s'applique plus une fois l'article terminé.
export function estTermine(item: SortableGiftItem): boolean {
  const g = groupe(item);
  return g === 4 || g === 5;
}

// Fond atténué ("déjà réglé") : mêmes deux groupes que "terminé".
export function estAttenue(item: SortableGiftItem): boolean {
  return estTermine(item);
}

export function sortGiftItems<T extends SortableGiftItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aPrioritaire = a.is_priority && !estTermine(a);
    const bPrioritaire = b.is_priority && !estTermine(b);
    if (aPrioritaire !== bPrioritaire) return aPrioritaire ? -1 : 1;
    return groupe(a) - groupe(b);
  });
}
