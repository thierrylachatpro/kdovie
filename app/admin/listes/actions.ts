"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventStatus } from "@/lib/event-status";

// Bascule ouverte/brouillon depuis l'admin, sur la liste de n'importe quel
// organisateur — même mécanisme que updateEventStatus côté organisateur
// (app/compte/evenements/[slug]/event-status-actions.ts), juste actionnable
// ici par un admin. Voir CLAUDE.md > "Refonte du dashboard
// super-administrateur" > "Section Listes".
export async function updateEventStatusAdmin(
  eventId: string,
  status: EventStatus,
): Promise<{ error: string | null }> {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    return { error: "Accès refusé." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("events").update({ status }).eq("id", eventId);

  if (!error) {
    revalidatePath("/admin/listes");
    revalidatePath("/admin");
  }

  return { error: error?.message ?? null };
}

// Suppression réelle et irréversible (DELETE, pas deleted_at) — décision
// explicite de l'utilisateur (20 août 2026), différente du soft delete côté
// organisateur (deleteEvent, app/compte/evenements/[slug]/event-actions.ts,
// conservé pour sa traçabilité comptable). Cascade déjà en place sur les FK
// (gift_items/reservations/contributions, migrations 0001/0002) : supprimer
// la liste supprime tout ce qui en dépend. Le nom de la liste doit être
// retapé exactement pour confirmer — pas un simple "Oui" comme les autres
// confirmations en deux temps du produit, vu la gravité (peut effacer la
// trace comptable d'une cotisation Stripe réellement encaissée).
export async function deleteEventPermanently(
  eventId: string,
  nomSaisi: string,
): Promise<{ error: string | null }> {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    return { error: "Accès refusé." };
  }

  const admin = createAdminClient();
  const { data: event } = await admin.from("events").select("name").eq("id", eventId).single();

  if (!event) {
    return { error: "Liste introuvable." };
  }
  if (nomSaisi.trim() !== event.name) {
    return { error: "Le nom saisi ne correspond pas exactement au nom de la liste." };
  }

  const { error } = await admin.from("events").delete().eq("id", eventId);

  if (!error) {
    revalidatePath("/admin/listes");
    revalidatePath("/admin");
  }

  return { error: error?.message ?? null };
}
