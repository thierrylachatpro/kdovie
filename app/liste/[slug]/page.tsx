import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import {
  formatPriceCents,
  giftItemStatusClassName,
  giftItemStatusLabel,
} from "@/lib/gift-item";

export default async function ListePubliquePage({
  params,
}: PageProps<"/liste/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, type, name, event_date")
    .eq("slug", slug)
    .single();

  if (!event) {
    notFound();
  }

  const { data: giftItems } = await supabase
    .from("gift_items")
    .select("id, title, price_cents, image_url, status")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

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

      {giftItems && giftItems.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {giftItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-gris/20 bg-white p-4"
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt=""
                  className="h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-lg bg-creme text-3xl">
                  🎁
                </div>
              )}
              <span className="font-medium text-foreground">{item.title}</span>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gris">
                  {formatPriceCents(item.price_cents)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${giftItemStatusClassName(item.status)}`}
                >
                  {giftItemStatusLabel(item.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-sm text-gris">
          Cette liste ne contient pas encore d&apos;article.
        </p>
      )}
    </main>
  );
}
