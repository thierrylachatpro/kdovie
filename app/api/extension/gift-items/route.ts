import { createClient } from "@/lib/supabase/server";
import { createGiftItemCore } from "@/lib/create-gift-item";

// Créé un cadeau depuis l'extension navigateur Chrome, appelée via l'onglet
// relais invisible (voir CLAUDE.md > "Extension navigateur Chrome" > "Onglet
// relais invisible pour l'authentification") — toujours same-origin, aucun
// CORS nécessaire.
//
// Réutilise le même cœur (`createGiftItemCore`) que la Server Action
// `createGiftItem` du formulaire "Ajouter un cadeau" — même calcul de
// position (nouveau cadeau en tête de liste), même insertion.
//
// La policy RLS `gift_items_insert_own_event` empêcherait de toute façon un
// insert sur la liste de quelqu'un d'autre, mais on vérifie quand même
// explicitement la propriété de l'événement ici (défense en profondeur
// demandée par CLAUDE.md : "jamais de confiance aveugle dans un event_id
// fourni par le client") pour renvoyer une erreur claire plutôt qu'une
// erreur RLS opaque.
type CorpsRequete = {
  eventId?: unknown;
  title?: unknown;
  priceCents?: unknown;
  imageUrl?: unknown;
  sourceUrl?: unknown;
  description?: unknown;
  originalTitle?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "non_connecte" }, { status: 401 });
  }

  let body: CorpsRequete;
  try {
    body = (await request.json()) as CorpsRequete;
  } catch {
    return Response.json({ error: "champs_invalides" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId : null;
  const title = typeof body.title === "string" ? body.title : null;
  if (!eventId || !title) {
    return Response.json({ error: "champs_invalides" }, { status: 400 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id, deleted_at")
    .eq("id", eventId)
    .single();

  if (!event || event.deleted_at || event.organizer_id !== user.id) {
    return Response.json({ error: "liste_introuvable" }, { status: 404 });
  }

  const priceCents = typeof body.priceCents === "number" ? body.priceCents : null;
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl : null;
  const description = typeof body.description === "string" ? body.description : null;
  const originalTitle = typeof body.originalTitle === "string" ? body.originalTitle : null;

  const result = await createGiftItemCore(supabase, {
    eventId,
    title,
    originalTitle,
    sourceUrl,
    imageUrl,
    description,
    priceCents,
  });

  if (result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json({ id: result.id }, { status: 201 });
}
