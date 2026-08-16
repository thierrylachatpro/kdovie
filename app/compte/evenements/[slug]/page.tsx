import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import { eventStatusClassName, eventStatusLabel, type EventStatus } from "@/lib/event-status";
import { initiales } from "@/lib/initials";
import CopierLienButton from "@/components/evenements/CopierLienButton";
import ToggleStatutButton from "@/components/evenements/ToggleStatutButton";
import AjouterArticleForm from "@/components/gift-items/AjouterArticleForm";
import GiftItemCard from "@/components/gift-items/GiftItemCard";

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

  const [{ data: profile }, { data: event }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("events")
      .select("id, type, name, slug, event_date, status")
      .eq("slug", slug)
      .eq("organizer_id", user.id)
      .single(),
  ]);

  if (!event) {
    notFound();
  }

  const { data: giftItems } = await supabase
    .from("gift_items")
    .select("id, title, price_cents, image_url, mode, status, funded_amount_cents")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const items = giftItems ?? [];
  const reservedIds = items.filter((i) => i.status === "reserve").map((i) => i.id);

  const { data: reservations } =
    reservedIds.length > 0
      ? await supabase
          .from("reservations")
          .select("gift_item_id, guest_name")
          .in("gift_item_id", reservedIds)
      : { data: [] };

  const guestNameByItemId = new Map(
    (reservations ?? []).map((r) => [r.gift_item_id, r.guest_name]),
  );

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

  const metaParts = [eventTypeLabel(event.type), dateFormatee, `${items.length} cadeaux`].filter(
    (part): part is string => Boolean(part),
  );

  const lockedCount = items.filter((i) => i.status !== "disponible").length;
  const lockedLabel =
    lockedCount === 0
      ? "Aucun cadeau verrouillé"
      : `${lockedCount} cadeau${lockedCount > 1 ? "x" : ""} verrouillé${lockedCount > 1 ? "s" : ""} par vos invités`;

  const nomAffiche = profile?.display_name?.trim() || user.email?.split("@")[0] || "";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-[1] bg-sauge" />
      </div>

      <header className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-5 px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <svg
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="block h-[38px] w-[38px]"
          >
            <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
            <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
            <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
            <path
              d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z"
              fill="#8BA888"
            />
            <path
              d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z"
              fill="#8BA888"
            />
          </svg>
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-2xl font-bold tracking-tight text-corail">
              kdovie
            </span>
            <span className="text-[13px] text-[#8A7263]">Vos listes de cadeaux, toute la vie</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/compte"
            className="rounded-2xl px-4 py-2.5 text-[15px] font-semibold text-[#5C4436] hover:bg-[#F7E7D6]"
          >
            Mes événements
          </Link>
          <Link
            href="/compte/profil"
            className="flex items-center gap-2.5 rounded-[18px] bg-[#F7E7D6] py-2 pr-4 pl-2 hover:bg-[#F2DFC9]"
          >
            <span className="font-heading flex h-9 w-9 items-center justify-center rounded-xl bg-corail text-[16px] font-bold text-creme">
              {initiales(nomAffiche)}
            </span>
            <span className="flex flex-col text-left leading-tight">
              <span className="text-[15px] font-semibold text-[#4A3529]">
                {nomAffiche || "Mon compte"}
              </span>
              <span className="text-[13px] text-[#8A7263]">Mon compte</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-6 pt-4 pb-20 sm:px-10">
        <Link
          href="/compte"
          className="mb-4.5 inline-block text-[15px] font-semibold text-corail hover:text-[#8F3A1C]"
        >
          ← Retour au tableau de bord
        </Link>

        <section className="mb-7 rounded-[32px] bg-[#F7E7D6] p-8">
          <div className="flex flex-wrap items-center gap-5.5">
            <span className="flex h-18 w-18 flex-none items-center justify-center rounded-[24px] bg-corail text-[32px]">
              {eventTypeIcon(event.type)}
            </span>
            <div className="min-w-60 flex-1">
              <h1 className="font-heading text-4xl leading-[1.1] font-bold text-[#C0512A]">
                {event.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 text-base text-[#7A6354]">
                <span>{metaParts.join(" · ")}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[13px] font-semibold ${eventStatusClassName(event.status)}`}
                >
                  {eventStatusLabel(event.status)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <CopierLienButton lien={lienPublic} />
              <ToggleStatutButton
                eventId={event.id}
                slug={event.slug}
                status={event.status as EventStatus}
              />
            </div>
          </div>
          {event.status === "brouillon" && (
            <p className="mt-4 text-sm text-[#7A6354]">
              Tant que la liste est en brouillon, les invités qui ouvrent le lien ne voient pas
              son contenu.
            </p>
          )}
        </section>

        {erreur && <p className="mb-4 text-sm text-corail-dark">{erreur}</p>}
        <div className="mb-9">
          <AjouterArticleForm eventId={event.id} slug={event.slug} />
        </div>

        <section>
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-heading text-[28px] font-bold text-[#C0512A]">
              Les cadeaux de la liste
            </h2>
            <span className="text-[15px] text-[#8A7263]">{lockedLabel}</span>
          </div>

          {items.length > 0 ? (
            <div className="flex flex-col gap-4">
              {items.map((item, index) => (
                <GiftItemCard
                  key={item.id}
                  item={item}
                  slug={event.slug}
                  toneIndex={index}
                  reservedByName={guestNameByItemId.get(item.id) ?? null}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gris">Aucun cadeau ajouté pour l&apos;instant.</p>
          )}

          <p className="mt-6 max-w-[640px] text-[15px] leading-relaxed text-[#8A7263]">
            Un cadeau se verrouille dès qu&apos;un invité le réserve ou commence à cotiser
            dessus, pour ne pas modifier sous ses yeux ce qu&apos;il vient de choisir. Contactez-
            nous si vous devez vraiment le retirer.
          </p>
        </section>
      </main>

      <footer className="bg-[#F7E7D6] px-6 py-6.5 sm:px-10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 text-sm text-[#8A7263]">
          <span>© 2026 kdovie</span>
          <nav className="flex flex-wrap items-center gap-6">
            <a href="#" className="hover:text-corail">
              Aide
            </a>
            <a href="#" className="hover:text-corail">
              Contact
            </a>
            <Link href="/compte" className="hover:text-corail">
              Mes événements
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
