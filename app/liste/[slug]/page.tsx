import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import ListePubliqueClient from "@/components/gift-items/ListePubliqueClient";

export default async function ListePubliquePage({
  params,
}: PageProps<"/liste/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, type, name, event_date, slug, status")
    .eq("slug", slug)
    .single();

  if (!event) {
    notFound();
  }

  const estOuverte = event.status === "ouverte";

  const { data: giftItems } = estOuverte
    ? await supabase
        .from("gift_items")
        .select("id, title, price_cents, image_url, status, mode")
        .eq("event_id", event.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const dateFormatee = event.event_date
    ? new Date(event.event_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-4xl">{eventTypeIcon(event.type)}</span>
        <h1 className="font-heading text-2xl font-bold text-corail">{event.name}</h1>
        <p className="text-sm text-gris">
          {eventTypeLabel(event.type)}
          {dateFormatee ? ` · ${dateFormatee}` : ""}
        </p>
      </div>

      {estOuverte ? (
        <ListePubliqueClient
          eventId={event.id}
          slug={event.slug}
          initialItems={giftItems ?? []}
        />
      ) : (
        <p className="mx-auto max-w-md text-center text-sm text-gris">
          Cette liste n&apos;est pas encore ouverte. Revenez un peu plus tard, l&apos;organisateur
          est en train de la préparer.
        </p>
      )}
    </main>
  );
}
