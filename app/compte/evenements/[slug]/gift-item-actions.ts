"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createGiftItem(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const slug = formData.get("slug")?.toString() ?? "";
  const eventId = formData.get("event_id")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const originalTitle = formData.get("original_title")?.toString().trim() || null;
  const sourceUrl = formData.get("source_url")?.toString().trim() || null;
  const imageUrl = formData.get("image_url")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString().trim();

  if (!title || !eventId) {
    redirect(`/compte/evenements/${slug}?erreur=champs_invalides`);
  }

  let priceCents: number | null = null;
  if (priceRaw) {
    const value = parseFloat(priceRaw.replace(",", "."));
    priceCents = Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
  }

  // Un nouveau cadeau se place en tête de liste (l'organisateur vient de
  // l'ajouter, il veut le voir) — l'ordre étant désormais entièrement manuel,
  // voir CLAUDE.md > "Glisser-déposer pour réordonner les cadeaux".
  const { data: premier } = await supabase
    .from("gift_items")
    .select("position")
    .eq("event_id", eventId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  const position = premier ? premier.position - 1 : 0;

  const { error } = await supabase.from("gift_items").insert({
    event_id: eventId,
    title,
    original_title: originalTitle,
    source_url: sourceUrl,
    image_url: imageUrl,
    description,
    price_cents: priceCents,
    position,
  });

  if (error) {
    redirect(`/compte/evenements/${slug}?erreur=erreur_article`);
  }

  revalidatePath(`/compte/evenements/${slug}`);
  redirect(`/compte/evenements/${slug}`);
}

export async function updateGiftItemMode(
  itemId: string,
  mode: string,
  slug: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { error } = await supabase.from("gift_items").update({ mode }).eq("id", itemId);

  if (!error) {
    revalidatePath(`/compte/evenements/${slug}`);
  }

  return { error: error?.message ?? null };
}

// Réordonne les cadeaux d'une liste d'après l'ordre passé (glisser-déposer,
// voir CLAUDE.md > "Glisser-déposer pour réordonner les cadeaux"). Jamais
// bloquée par le verrouillage d'un article — `position` n'est pas dans le
// trigger protect_gift_item_mode (migration 0022). L'ordre s'applique aussi
// à la page publique /liste/[slug], d'où sa revalidation.
export async function reorderGiftItems(
  slug: string,
  orderedIds: string[],
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .eq("organizer_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!event) {
    return { error: "Liste introuvable." };
  }

  // La policy RLS gift_items_update_own_event garantit déjà que l'organisateur
  // ne peut toucher que ses propres cadeaux ; le filtre event_id évite en plus
  // qu'un id d'une autre liste se glisse dans la requête.
  const resultats = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("gift_items")
        .update({ position: index })
        .eq("id", id)
        .eq("event_id", event.id),
    ),
  );

  const echec = resultats.find((r) => r.error);
  if (echec?.error) {
    return { error: "L'ordre n'a pas pu être enregistré, réessayez." };
  }

  revalidatePath(`/compte/evenements/${slug}`);
  revalidatePath(`/liste/${slug}`);
  return { error: null };
}

export async function updateGiftItem(
  itemId: string,
  slug: string,
  data: { title: string; price: string; imageUrl: string; description: string },
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const title = data.title.trim();
  if (!title) {
    return { error: "Le titre ne peut pas être vide." };
  }

  let priceCents: number | null = null;
  const priceRaw = data.price.trim();
  if (priceRaw) {
    const value = parseFloat(priceRaw.replace(",", "."));
    priceCents = Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
  }

  const { error } = await supabase
    .from("gift_items")
    .update({
      title,
      price_cents: priceCents,
      image_url: data.imageUrl.trim() || null,
      description: data.description.trim() || null,
    })
    .eq("id", itemId);

  if (!error) {
    revalidatePath(`/compte/evenements/${slug}`);
  }

  return {
    error: error
      ? "Cet article est verrouillé, un invité a déjà agi dessus."
      : null,
  };
}

export async function deleteGiftItem(
  itemId: string,
  slug: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { error } = await supabase.from("gift_items").delete().eq("id", itemId);

  if (!error) {
    revalidatePath(`/compte/evenements/${slug}`);
  }

  return {
    error: error
      ? "Cet article est verrouillé, un invité a déjà agi dessus."
      : null,
  };
}
