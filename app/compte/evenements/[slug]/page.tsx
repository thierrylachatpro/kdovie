import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import { eventStatusClassName, eventStatusLabel, type EventStatus } from "@/lib/event-status";
import {
  formatPriceCents,
  giftItemStatusClassName,
  giftItemStatusLabel,
} from "@/lib/gift-item";
import CopierLienButton from "@/components/evenements/CopierLienButton";
import ToggleStatutButton from "@/components/evenements/ToggleStatutButton";
import AjouterArticleForm from "@/components/gift-items/AjouterArticleForm";
import ModeSelect from "@/components/gift-items/ModeSelect";

const MESSAGES_ERREUR: Record<string, string> = {
  champs_invalides: "Merci de renseigner au moins le lien et le titre de l'article.",
  erreur_article: "Une erreur est survenue lors de l'ajout de l'article, réessayez.",
};

export default async function EvenementPage({
  params,
  searchParams,
}: PageProps<"/compte/evenements/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const erreurParam = sp.erreur;
  const erreur = typeof erreurParam === "string" ? MESSAGES_ERREUR[erreurParam] : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, type, name, slug, event_date, status")
    .eq("slug", slug)
    .eq("organizer_id", user.id)
    .single();

  if (!event) {
    notFound();
  }

  const { data: giftItems } = await supabase
    .from("gift_items")
    .select("id, title, price_cents, image_url, mode, status")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const lienPublic = `${protocol}://${host}/liste/${event.slug}`;

  const dateFormatee = event.event_date
    ? new Date(event.event_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <Link href="/compte" className="self-start text-sm text-gris">
        ← Retour au tableau de bord
      </Link>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-4xl">{eventTypeIcon(event.type)}</span>
        <h1 className="font-heading text-2xl font-bold text-corail">{event.name}</h1>
        <p className="text-sm text-gris">
          {eventTypeLabel(event.type)}
          {dateFormatee ? ` · ${dateFormatee}` : ""}
        </p>
        <span
          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${eventStatusClassName(event.status)}`}
        >
          {eventStatusLabel(event.status)}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-xl border border-gris/20 bg-white p-6 text-center">
        <p className="text-sm text-gris">Lien public de la liste</p>
        <p className="break-all text-sm font-medium text-foreground">{lienPublic}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <CopierLienButton lien={lienPublic} />
          <ToggleStatutButton
            eventId={event.id}
            slug={event.slug}
            status={event.status as EventStatus}
          />
        </div>
        {event.status === "brouillon" && (
          <p className="text-xs text-gris">
            Tant que la liste est en brouillon, les invités qui ouvrent ce lien ne voient pas
            son contenu.
          </p>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Ajouter un article
        </h2>
        {erreur && <p className="text-sm text-corail-dark">{erreur}</p>}
        <AjouterArticleForm eventId={event.id} slug={event.slug} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-bold text-foreground">
          Articles de la liste
          {giftItems && giftItems.length > 0 ? ` (${giftItems.length})` : ""}
        </h2>

        {giftItems && giftItems.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {giftItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-gris/20 bg-white p-4"
              >
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt=""
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-creme text-2xl">
                    🎁
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-1 text-left">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="text-sm text-gris">
                    {formatPriceCents(item.price_cents)}
                  </span>
                  <span
                    className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${giftItemStatusClassName(item.status)}`}
                  >
                    {giftItemStatusLabel(item.status)}
                  </span>
                </div>
                <ModeSelect
                  itemId={item.id}
                  slug={event.slug}
                  mode={item.mode}
                  disabled={item.status !== "disponible"}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gris">Aucun article ajouté pour l&apos;instant.</p>
        )}
      </section>
    </main>
  );
}
