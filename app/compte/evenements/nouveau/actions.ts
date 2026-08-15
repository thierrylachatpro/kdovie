"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EVENT_TYPES } from "@/lib/event-types";
import { generateEventSlug, slugify } from "@/lib/slug";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const type = formData.get("type")?.toString() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const eventDate = formData.get("event_date")?.toString() || null;
  const submittedSlug = formData.get("slug")?.toString().trim() ?? "";

  if (!EVENT_TYPES.some((t) => t.id === type) || !name) {
    redirect("/compte/evenements/nouveau?erreur=champs_invalides");
  }

  const slug = slugify(submittedSlug) || generateEventSlug(name);

  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      type,
      name,
      event_date: eventDate,
      slug,
    })
    .select("slug")
    .single();

  if (error) {
    const erreur = error.code === "23505" ? "slug_pris" : "erreur";
    redirect(`/compte/evenements/nouveau?erreur=${erreur}`);
  }

  redirect(`/compte/evenements/${data.slug}`);
}
