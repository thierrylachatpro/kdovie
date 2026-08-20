import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { EventStatus } from "@/lib/event-status";
import { sortGiftItems } from "@/lib/gift-item-sort";
import EnTeteListe from "@/components/evenements/EnTeteListe";
import VisibiliteListe from "@/components/evenements/VisibiliteListe";
import AjouterArticleForm from "@/components/gift-items/AjouterArticleForm";
import GiftItemCard from "@/components/gift-items/GiftItemCard";
import LiensLegaux from "@/components/layout/LiensLegaux";
import NavConnecte from "@/components/layout/NavConnecte";

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
    .is("deleted_at", null)
    .single();

  if (!event) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const pseudo = profile?.display_name?.trim() || null;

  const { data: giftItems } = await supabase
    .from("gift_items")
    .select(
      "id, title, original_title, price_cents, image_url, description, source_url, mode, status, funded_amount_cents, is_priority",
    )
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const items = sortGiftItems(giftItems ?? []);
  const reservedIds = items.filter((i) => i.status === "reserve").map((i) => i.id);
  const cagnotteIds = items.filter((i) => i.status === "cagnotte").map((i) => i.id);

  const [{ data: reservations }, { data: contributions }] = await Promise.all([
    reservedIds.length > 0
      ? supabase.from("reservations").select("gift_item_id, guest_name").in("gift_item_id", reservedIds)
      : Promise.resolve({ data: [] }),
    cagnotteIds.length > 0
      ? supabase
          .from("contributions")
          .select("gift_item_id, guest_name")
          .eq("status", "succeeded")
          .in("gift_item_id", cagnotteIds)
      : Promise.resolve({ data: [] }),
  ]);

  const guestNameByItemId = new Map(
    (reservations ?? []).map((r) => [r.gift_item_id, r.guest_name]),
  );
  const contributorNamesByItemId = new Map<string, (string | null)[]>();
  (contributions ?? []).forEach((c) => {
    const current = contributorNamesByItemId.get(c.gift_item_id) ?? [];
    current.push(c.guest_name);
    contributorNamesByItemId.set(c.gift_item_id, current);
  });

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const lienPublic = `${protocol}://${host}/liste/${event.slug}`;

  const lockedCount = items.filter((i) => i.status !== "disponible").length;
  const lockedLabel =
    lockedCount === 0
      ? "Aucun cadeau verrouillé"
      : `${lockedCount} cadeau${lockedCount > 1 ? "x" : ""} verrouillé${lockedCount > 1 ? "s" : ""} par vos invités`;

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
            <span className="text-[13px] text-[#8A7263]">Un seul compte, toute une vie de cadeaux</span>
          </span>
        </Link>
        <NavConnecte estConnecte={true} pseudo={pseudo} />
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col px-6 pt-4 pb-20 sm:px-10">
        <EnTeteListe
          eventId={event.id}
          slug={event.slug}
          name={event.name}
          type={event.type}
          eventDate={event.event_date}
          itemCount={items.length}
        />

        <VisibiliteListe
          eventId={event.id}
          slug={event.slug}
          status={event.status as EventStatus}
          eventName={event.name}
          lienPublic={lienPublic}
        />

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
                  contributorNames={contributorNamesByItemId.get(item.id) ?? []}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gris">Aucun cadeau ajouté pour l&apos;instant.</p>
          )}
        </section>
      </main>

      <footer className="bg-[#F7E7D6] px-6 py-6.5 sm:px-10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 text-sm text-[#8A7263]">
          <span>© 2026 kdovie</span>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/aide" className="hover:text-corail">
              Aide
            </Link>
            <Link href="/contact" className="hover:text-corail">
              Contact
            </Link>
            <LiensLegaux className="hover:text-corail" />
            <Link href="/compte" className="hover:text-corail">
              Mes listes
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
