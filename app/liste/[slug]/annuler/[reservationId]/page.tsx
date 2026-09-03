import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cancelReservation } from "@/app/liste/[slug]/cancel-reservation-actions";
import NavAnonyme from "@/components/layout/NavAnonyme";
import NavConnecte from "@/components/layout/NavConnecte";
import PiedDePage from "@/components/layout/PiedDePage";

// Jeton secret (UUID de réservation) dans l'URL — jamais indexé ni suivi.
export const metadata: Metadata = {
  title: "Annuler une réservation",
  robots: { index: false, follow: false },
};

export default async function AnnulerReservationPage({
  params,
  searchParams,
}: PageProps<"/liste/[slug]/annuler/[reservationId]">) {
  const { slug, reservationId } = await params;
  const sp = await searchParams;
  const erreur = sp.erreur === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pseudo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    pseudo = profile?.first_name?.trim() || user.email?.split("@")[0] || null;
  }

  const admin = createAdminClient();
  const { data: reservation } = await admin
    .from("reservations")
    .select("id, cancelled_at, gift_item_id")
    .eq("id", reservationId)
    .maybeSingle();

  let giftTitle: string | null = null;
  if (reservation) {
    const { data: item } = await admin
      .from("gift_items")
      .select("title")
      .eq("id", reservation.gift_item_id)
      .maybeSingle();
    giftTitle = item?.title ?? null;
  }

  const indisponible = !reservation || reservation.cancelled_at !== null || erreur;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-1 bg-sauge" />
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
          <span className="font-heading text-2xl font-bold tracking-tight text-corail">
            kdovie
          </span>
        </Link>
        <NavConnecte estConnecte={Boolean(user)} pseudo={pseudo} />
        <NavAnonyme estConnecte={Boolean(user)} />
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6 pt-6 pb-20 sm:px-10">
        <section className="mt-6 rounded-[32px] border-2 border-[#F2DFC9] bg-white px-10 py-16 text-center">
          {indisponible ? (
            <>
              <div className="mx-auto mb-5.5 flex h-18 w-18 items-center justify-center rounded-[24px] bg-[#F7E7D6] text-3xl">
                🔗
              </div>
              <h1 className="font-heading text-[28px] font-bold text-[#C0512A]">
                Cette réservation n&apos;existe plus
              </h1>
              <p className="mx-auto mt-3 mb-7 max-w-[400px] text-[16px] leading-relaxed text-[#7A6354]">
                Elle a peut-être déjà été annulée, ou le lien n&apos;est plus valide.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5.5 flex h-18 w-18 items-center justify-center rounded-[24px] bg-[#F7E7D6] text-3xl">
                🎁
              </div>
              <h1 className="font-heading text-[28px] font-bold text-[#4A3529]">
                Annuler votre réservation ?
              </h1>
              {giftTitle && (
                <p className="mx-auto mt-3 mb-7 max-w-[400px] text-[16px] leading-relaxed text-[#7A6354]">
                  Vous avez réservé « <strong>{giftTitle}</strong> ». Si vous annulez, cet article
                  redeviendra disponible pour les autres invités.
                </p>
              )}
              <form action={cancelReservation.bind(null, reservationId, slug)}>
                <button
                  type="submit"
                  className="font-heading inline-block rounded-2xl bg-corail px-6.5 py-4 text-base font-bold text-creme hover:bg-[#D45F37]"
                >
                  Oui, annuler ma réservation
                </button>
              </form>
            </>
          )}
          <Link
            href={`/liste/${slug}`}
            className="mt-6 inline-block text-sm font-semibold text-[#8A7263] underline"
          >
            Retour à la liste
          </Link>
        </section>
      </main>

      <PiedDePage />
    </div>
  );
}
