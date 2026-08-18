"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPES } from "@/lib/event-types";

export async function updateEvent(
  eventId: string,
  slug: string,
  data: { name: string; type: string | null; eventDate: string },
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const name = data.name.trim();
  if (!name) {
    return { error: "Le nom ne peut pas être vide." };
  }
  if (data.type !== null && !EVENT_TYPES.some((t) => t.id === data.type)) {
    return { error: "Type invalide." };
  }

  const { error } = await supabase
    .from("events")
    .update({ name, type: data.type, event_date: data.eventDate.trim() || null })
    .eq("id", eventId);

  if (!error) {
    revalidatePath(`/compte/evenements/${slug}`);
    revalidatePath("/compte");
  }

  return { error: error?.message ?? null };
}

// Soft delete (deleted_at, jamais de suppression réelle) — voir CLAUDE.md >
// "Suppression d'une liste par l'organisateur". Irréversible pour
// l'organisateur : seul le super-administrateur peut restaurer.
export async function deleteEvent(eventId: string, slug: string): Promise<{ error: string | null } | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) {
    return { error: "Impossible de supprimer la liste, réessayez." };
  }

  revalidatePath(`/compte/evenements/${slug}`);
  revalidatePath("/compte");
  redirect("/compte");
}
