// Ordre des cadeaux, identique sur /liste/[slug] et /compte/evenements/[slug].
//
// Depuis le glisser-déposer (voir CLAUDE.md > "Glisser-déposer pour
// réordonner les cadeaux") : l'ordre est entièrement manuel, piloté par la
// colonne `position` que l'organisateur ajuste. Plus de tri automatique par
// statut, plus de remontée des cadeaux "mis en avant" — `is_priority` n'est
// plus lue.
//
// `estAttenue` reste : ce n'est pas un critère d'ordre, juste un repère
// visuel ("déjà réglé") pour un cadeau réservé ou une cagnotte finalisée.

export type SortableGiftItem = {
  status: string;
  price_cents: number | null;
  funded_amount_cents: number;
  position: number;
};

// "Terminé" = cagnotte finalisée ou article réservé.
function estTermine(item: SortableGiftItem): boolean {
  if (item.status === "reserve") return true;
  if (item.status === "cagnotte") {
    return item.price_cents !== null && item.funded_amount_cents >= item.price_cents;
  }
  return false;
}

// Fond atténué ("déjà réglé") — purement visuel, n'influe pas sur l'ordre.
export function estAttenue(item: SortableGiftItem): boolean {
  return estTermine(item);
}

export function sortGiftItems<T extends SortableGiftItem>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}
