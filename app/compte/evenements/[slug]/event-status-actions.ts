"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus } from "@/lib/event-status";

export async function updateEventStatus(
  eventId: string,
  status: EventStatus,
  slug: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { error } = await supabase.from("events").update({ status }).eq("id", eventId);

  if (!error) {
    revalidatePath(`/compte/evenements/${slug}`);
    revalidatePath("/compte");
  }

  return { error: error?.message ?? null };
}
