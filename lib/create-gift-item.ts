import type { createClient } from "@/lib/supabase/server";

// Cœur partagé de la création d'un cadeau — factorisé pour être appelé à la
// fois par la Server Action historique (`createGiftItem`, formulaire "Ajouter
// un cadeau") et par la route API de l'extension navigateur
// (`POST /api/extension/gift-items`), voir CLAUDE.md > "Extension navigateur
// Chrome". Prend un client Supabase déjà authentifié (cookie-based, RLS
// active) — jamais le client service_role : la policy `gift_items_insert_own_event`
// vérifie déjà que l'appelant est bien l'organisateur de l'événement ciblé,
// pas la peine de dupliquer cette vérification ici.

export type CreateGiftItemInput = {
  eventId: string;
  title: string;
  originalTitle?: string | null;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  priceCents?: number | null;
};

export type CreateGiftItemResult =
  | { id: string; error: null }
  | { id: null; error: "champs_invalides" | "erreur_article" };

export async function createGiftItemCore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: CreateGiftItemInput,
): Promise<CreateGiftItemResult> {
  const title = input.title.trim();
  if (!title || !input.eventId) {
    return { id: null, error: "champs_invalides" };
  }

  // Un nouveau cadeau se place en tête de liste (l'organisateur/l'extension
  // vient de l'ajouter) — l'ordre étant entièrement manuel, voir CLAUDE.md >
  // "Glisser-déposer pour réordonner les cadeaux".
  const { data: premier } = await supabase
    .from("gift_items")
    .select("position")
    .eq("event_id", input.eventId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  const position = premier ? premier.position - 1 : 0;

  const { data, error } = await supabase
    .from("gift_items")
    .insert({
      event_id: input.eventId,
      title,
      original_title: input.originalTitle ?? null,
      source_url: input.sourceUrl ?? null,
      image_url: input.imageUrl ?? null,
      description: input.description ?? null,
      price_cents: input.priceCents ?? null,
      position,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { id: null, error: "erreur_article" };
  }

  return { id: data.id, error: null };
}
