export type EventStatus = "brouillon" | "ouverte";

const EVENT_STATUSES: Record<EventStatus, { label: string; className: string }> = {
  brouillon: { label: "Brouillon", className: "bg-jaune/25 text-corail-dark" },
  ouverte: { label: "Liste ouverte", className: "bg-sauge/20 text-sauge-dark" },
};

export function eventStatusLabel(status: string): string {
  return EVENT_STATUSES[status as EventStatus]?.label ?? status;
}

export function eventStatusClassName(status: string): string {
  return EVENT_STATUSES[status as EventStatus]?.className ?? "bg-gris/20 text-gris";
}
