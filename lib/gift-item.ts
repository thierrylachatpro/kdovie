export const GIFT_ITEM_MODES: { id: string; label: string }[] = [
  { id: "auto", label: "Cotisation et Réservation" },
  { id: "cotisation_obligatoire", label: "Cotisation uniquement" },
  { id: "cotisation_impossible", label: "Réservation uniquement" },
];

const GIFT_ITEM_STATUSES: Record<string, { label: string; className: string }> = {
  disponible: { label: "Disponible", className: "bg-sauge/20 text-sauge-dark" },
  reserve: { label: "Réservé", className: "bg-corail/15 text-corail-dark" },
  cagnotte: { label: "Cagnotte en cours", className: "bg-jaune/25 text-corail-dark" },
};

export function giftItemStatusLabel(status: string): string {
  return GIFT_ITEM_STATUSES[status]?.label ?? status;
}

export function giftItemStatusClassName(status: string): string {
  return GIFT_ITEM_STATUSES[status]?.className ?? "bg-gris/20 text-gris";
}

export function formatPriceCents(cents: number | null): string {
  if (cents === null) return "Prix non renseigné";
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// Garde-fou pour les emails (objet + corps) : gift_items.title est déjà
// raccourci au scraping pour les nouveaux articles (voir CLAUDE.md >
// "Raccourcissement automatique du titre scrapé"), mais pas rétroactivement
// ni pour un titre saisi à la main — tronque sur une limite de mot, jamais
// au milieu d'un mot.
export function truncateTitle(title: string, maxLength = 60): string {
  if (title.length <= maxLength) return title;
  const cut = title.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
