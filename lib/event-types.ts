export type EventType =
  | "naissance"
  | "anniversaire"
  | "mariage"
  | "noel"
  | "pot_depart"
  | "cremaillere"
  | "bapteme";

export const EVENT_TYPES: { id: EventType; label: string; icon: string }[] = [
  { id: "naissance", label: "Naissance", icon: "🍼" },
  { id: "anniversaire", label: "Anniversaire", icon: "🎂" },
  { id: "mariage", label: "Mariage", icon: "💍" },
  { id: "noel", label: "Noël", icon: "🎄" },
  { id: "pot_depart", label: "Pot de départ", icon: "👋" },
  { id: "cremaillere", label: "Crémaillère", icon: "🏡" },
  { id: "bapteme", label: "Baptême", icon: "⛪" },
];

export function eventTypeLabel(type: string | null): string {
  if (!type) return "Liste";
  return EVENT_TYPES.find((t) => t.id === type)?.label ?? type;
}

export function eventTypeIcon(type: string | null): string {
  if (!type) return "🎁";
  return EVENT_TYPES.find((t) => t.id === type)?.icon ?? "🎁";
}
