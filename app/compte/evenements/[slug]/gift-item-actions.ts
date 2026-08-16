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
  const sourceUrl = formData.get("source_url")?.toString().trim() ?? "";
  const imageUrl = formData.get("image_url")?.toString().trim() || null;
  const priceRaw = formData.get("price")?.toString().trim();

  if (!title || !sourceUrl || !eventId) {
    redirect(`/compte/evenements/${slug}?erreur=champs_invalides`);
  }

  let priceCents: number | null = null;
  if (priceRaw) {
    const value = parseFloat(priceRaw.replace(",", "."));
    priceCents = Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
  }

  const { error } = await supabase.from("gift_items").insert({
    event_id: eventId,
    title,
    source_url: sourceUrl,
    image_url: imageUrl,
    price_cents: priceCents,
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

export async function updateGiftItem(
  itemId: string,
  slug: string,
  data: { title: string; price: string; imageUrl: string },
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
    .update({ title, price_cents: priceCents, image_url: data.imageUrl.trim() || null })
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
