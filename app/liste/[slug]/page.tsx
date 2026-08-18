import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import ListePubliqueClient from "@/components/gift-items/ListePubliqueClient";
import type { FeeMode } from "@/lib/fee-calculation";
import type { OrganizerStripeStatus } from "@/lib/organizer-stripe-status";

export default async function ListePubliquePage({
  params,
}: PageProps<"/liste/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, type, name, event_date, slug, status, organizer_id, fee_mode")
    .eq("slug", slug)
    .single();

  if (!event) {
    notFound();
  }

  const { data: organizerProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", event.organizer_id)
    .single();
  const organizerPseudo = organizerProfile?.display_name?.trim() || null;

  // Colonne payouts_enabled ouverte à anon (migration 0010) uniquement,
  // stripe_account_id/organizer_id restent privés — voir CLAUDE.md > tâche #18.
  const { data: stripeAccount } = await supabase
    .from("organizer_stripe_accounts")
    .select("payouts_enabled")
    .eq("organizer_id", event.organizer_id)
    .maybeSingle();

  const organizerStripeStatus: OrganizerStripeStatus = !stripeAccount
    ? "aucun"
    : stripeAccount.payouts_enabled
      ? "actif"
      : "en_attente";

  const estOuverte = event.status === "ouverte";

  const { data: giftItems } = estOuverte
    ? await supabase
        .from("gift_items")
        .select(
          "id, title, original_title, price_cents, image_url, source_url, status, mode, funded_amount_cents, is_priority",
        )
        .eq("event_id", event.id)
        .order("created_at", { ascending: false })
    : { data: null };

  const estVide = estOuverte && (giftItems?.length ?? 0) === 0;

  const dateFormatee = event.event_date
    ? new Date(event.event_date).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const metaParts = [
    eventTypeLabel(event.type),
    dateFormatee,
    organizerPseudo ? `liste de ${organizerPseudo}` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-[1] bg-sauge" />
      </div>

      <header className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-5 px-6 py-5 sm:px-10">
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
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-6 pt-5 pb-20 sm:px-10">
        {estOuverte && !estVide ? (
          <ListePubliqueClient
            eventId={event.id}
            slug={event.slug}
            eventName={event.name}
            typeIcon={eventTypeIcon(event.type)}
            metaText={metaParts.join(" · ")}
            initialItems={giftItems ?? []}
            feeMode={event.fee_mode as FeeMode}
            organizerStripeStatus={organizerStripeStatus}
          />
        ) : (
          <>
            <section className="mb-7 rounded-[32px] bg-[#F7E7D6] p-9">
              <div className="flex flex-wrap items-center gap-5.5">
                <span className="flex h-19 w-19 flex-none items-center justify-center rounded-[26px] bg-corail text-[34px]">
                  {eventTypeIcon(event.type)}
                </span>
                <div className="min-w-60 flex-1">
                  <h1 className="font-heading text-[38px] leading-[1.1] font-bold text-[#C0512A]">
                    {event.name}
                  </h1>
                  <div className="text-[17px] text-[#7A6354]">{metaParts.join(" · ")}</div>
                </div>
              </div>
            </section>

            {!estOuverte && (
              <section className="rounded-[32px] border-2 border-[#F2DFC9] bg-white px-10 py-15 text-center">
                <div className="mx-auto mb-5.5 flex h-18 w-18 items-center justify-center rounded-[24px] bg-[#F5E3C9] text-3xl">
                  ⏳
                </div>
                <h2 className="font-heading text-[28px] font-bold text-[#4A3529]">
                  Cette liste n&apos;est pas encore ouverte
                </h2>
                <p className="mx-auto mt-3 max-w-[480px] text-[17px] leading-relaxed text-[#7A6354]">
                  Son organisateur la prépare encore. Revenez avec ce même lien un peu plus tard :
                  les cadeaux apparaîtront dès qu&apos;elle sera partagée.
                </p>
              </section>
            )}

            {estVide && (
              <section className="rounded-[32px] border-2 border-[#F2DFC9] bg-white px-10 py-15 text-center">
                <div className="mx-auto mb-5.5 flex h-18 w-18 items-center justify-center rounded-[24px] bg-[#F7E7D6] text-3xl">
                  🎁
                </div>
                <h2 className="font-heading text-[28px] font-bold text-[#4A3529]">
                  Aucun cadeau pour le moment
                </h2>
                <p className="mx-auto mt-3 max-w-[480px] text-[17px] leading-relaxed text-[#7A6354]">
                  La liste est bien ouverte, mais elle est encore vide. Repassez dans quelques
                  jours, les idées arrivent souvent au fil de l&apos;eau.
                </p>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="bg-[#F7E7D6] px-6 py-6.5 sm:px-10">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-6 text-sm text-[#8A7263]">
          <span>© 2026 kdovie</span>
          <nav className="flex flex-wrap items-center gap-6">
            <a href="#" className="hover:text-corail">
              Aide
            </a>
            <a href="#" className="hover:text-corail">
              Contact
            </a>
            <Link href="/" className="hover:text-corail">
              Créer ma propre liste
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
