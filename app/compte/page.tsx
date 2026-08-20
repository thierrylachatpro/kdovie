import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import { eventStatusClassName, eventStatusLabel } from "@/lib/event-status";
import { formatPriceCents } from "@/lib/gift-item";
import DeconnexionButton from "@/components/auth/DeconnexionButton";
import FilActivite, { type ActiviteItem } from "@/components/compte/FilActivite";
import LiensLegaux from "@/components/layout/LiensLegaux";
import NavConnecte from "@/components/layout/NavConnecte";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("events")
      .select("id, type, name, slug, event_date, status")
      .eq("organizer_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const eventIds = (events ?? []).map((e) => e.id);

  const { data: giftItems } =
    eventIds.length > 0
      ? await supabase
          .from("gift_items")
          .select("id, event_id, title, status, price_cents, funded_amount_cents, created_at")
          .in("event_id", eventIds)
      : { data: [] };

  const [{ data: reservations }, { data: contributions }] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, guest_name, reserved_at, gift_items(title)")
      .order("reserved_at", { ascending: false })
      .limit(5),
    supabase
      .from("contributions")
      .select("id, guest_name, amount_cents, created_at, gift_items(title)")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const nomAffiche = profile?.display_name?.trim() || user.email?.split("@")[0] || "";
  const prenom = nomAffiche.split(/\s+/)[0] ?? "";
  const pseudo = profile?.display_name?.trim() || null;

  const itemsParEvenement = new Map<string, typeof giftItems>();
  (giftItems ?? []).forEach((item) => {
    const liste = itemsParEvenement.get(item.event_id) ?? [];
    liste.push(item);
    itemsParEvenement.set(item.event_id, liste);
  });

  const totalCadeaux = giftItems?.length ?? 0;
  const totalReserves = (giftItems ?? []).filter((i) => i.status !== "disponible").length;

  const evenementsAvecStats = (events ?? []).map((event) => {
    const items = itemsParEvenement.get(event.id) ?? [];
    const total = items.length;
    const termines = items.filter((i) => i.status !== "disponible").length;
    const percent = total > 0 ? Math.round((termines / total) * 100) : 0;
    const dateFormatee = event.event_date
      ? new Date(event.event_date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
        })
      : null;

    return {
      ...event,
      total,
      termines,
      percent,
      dateFormatee,
    };
  });

  const activite: ActiviteItem[] = [
    ...(reservations ?? []).map((r) => ({
      nom: r.guest_name ?? "Anonyme",
      texte: `a réservé « ${r.gift_items?.title ?? "un cadeau"} »`,
      date: r.reserved_at,
      couleur: "#8BA888",
    })),
    ...(contributions ?? []).map((c) => ({
      nom: c.guest_name ?? "Anonyme",
      texte: `a cotisé ${formatPriceCents(c.amount_cents)} pour « ${c.gift_items?.title ?? "un cadeau"} »`,
      date: c.created_at,
      couleur: "#E8734A",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const dernierEvenement = events?.[0];
  const lienAjoutRapide = dernierEvenement
    ? `/compte/evenements/${dernierEvenement.slug}`
    : "/compte/evenements/nouveau";

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
        <section className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-[42px] leading-[1.1] font-bold text-corail">
              Bonjour {prenom || "vous"}
            </h1>
            <p className="mt-2.5 text-lg text-[#7A6354]">
              {evenementsAvecStats.length} liste{evenementsAvecStats.length > 1 ? "s" : ""} dans
              votre compte, {totalReserves} cadeau{totalReserves > 1 ? "x" : ""} déjà réservé
              {totalReserves > 1 ? "s" : ""} par vos proches.
            </p>
          </div>
          <Link
            href="/compte/evenements/nouveau"
            className="font-heading rounded-[20px] bg-corail px-[26px] py-[17px] text-[17px] font-bold text-creme hover:bg-[#D45F37]"
          >
            + Nouvelle liste
          </Link>
        </section>

        <section className="mb-8 flex flex-wrap items-center gap-x-5.5 gap-y-2.5 text-[15px] text-[#7A6354]">
          <span className="inline-flex items-center gap-2">
            <span className="block h-2.5 w-2.5 rounded-[3px] bg-corail" />
            <strong className="font-semibold text-[#4A3529]">
              {evenementsAvecStats.length}
            </strong>{" "}
            listes
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="block h-2.5 w-2.5 rounded-[3px] bg-jaune" />
            <strong className="font-semibold text-[#4A3529]">{totalCadeaux}</strong> cadeaux
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="block h-2.5 w-2.5 rounded-[3px] bg-sauge" />
            <strong className="font-semibold text-[#4A3529]">{totalReserves}</strong> déjà
            réservés
          </span>
        </section>

        <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-[28px] bg-[#F5E3C9] p-6.5">
            <h2 className="font-heading mb-2.5 text-xl font-bold text-[#7A5A16]">
              Ajouter un cadeau en un lien
            </h2>
            <p className="mb-4 text-[15px] leading-relaxed text-[#6B5426]">
              Collez l&apos;adresse d&apos;une page produit, de n&apos;importe quelle boutique.
            </p>
            <Link
              href={lienAjoutRapide}
              className="font-heading inline-block rounded-2xl bg-corail px-5 py-3.5 text-[15px] font-bold text-creme hover:bg-[#D45F37]"
            >
              Ajouter un cadeau
            </Link>
          </div>
          <div className="rounded-[28px] bg-[#DCE7DA] p-6.5">
            <h2 className="font-heading mb-2.5 text-xl font-bold text-[#2F4A2C]">
              Une simple liste d&apos;envies
            </h2>
            <p className="mb-4 text-[15px] leading-relaxed text-[#3D5A39]">
              Pas d&apos;occasion particulière, pas de date : créez une liste ouverte, et
              ajoutez-y des idées au fil de l&apos;année.
            </p>
            <Link
              href="/compte/evenements/nouveau"
              className="font-heading inline-block rounded-2xl bg-creme px-5 py-3.5 text-[15px] font-bold text-[#2F4A2C] hover:bg-white"
            >
              Créer une liste simple
            </Link>
          </div>
        </section>

        <section className="mb-11">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-heading text-[28px] font-bold text-[#C0512A]">
              Mes listes
            </h2>
            <span className="text-[15px] text-[#8A7263]">
              {evenementsAvecStats.length} liste
              {evenementsAvecStats.length > 1 ? "s" : ""} · les plus récentes d&apos;abord
            </span>
          </div>

          {evenementsAvecStats.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {evenementsAvecStats.map((event) => (
                <article
                  key={event.id}
                  className="flex flex-col gap-4.5 rounded-[28px] border-2 border-[#F2DFC9] bg-white p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-13 w-13 flex-none items-center justify-center rounded-[18px] bg-jaune/25 text-2xl">
                      {eventTypeIcon(event.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading truncate text-[21px] font-bold text-[#4A3529]">
                        {event.name}
                      </h3>
                      <div className="text-sm text-[#8A7263]">
                        {[
                          event.type ? eventTypeLabel(event.type) : null,
                          event.dateFormatee,
                          `${event.total} cadeau${event.total > 1 ? "x" : ""}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <span
                      className={`flex-none rounded-full px-3 py-1.5 text-[13px] font-semibold ${eventStatusClassName(event.status)}`}
                    >
                      {eventStatusLabel(event.status)}
                    </span>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm font-semibold text-[#5C4436]">
                      <span>
                        {event.total > 0
                          ? `${event.termines} sur ${event.total} cadeaux réservés`
                          : "Aucun cadeau pour l'instant"}
                      </span>
                      <span className="text-[#8A7263]">{event.percent} %</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#F7E7D6]">
                      <div
                        className="h-2.5 rounded-full bg-sauge"
                        style={{ width: `${event.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2.5">
                    <Link
                      href={`/compte/evenements/${event.slug}`}
                      className="font-heading rounded-2xl bg-corail px-5 py-3 text-[15px] font-bold text-creme hover:bg-[#D45F37]"
                    >
                      Ouvrir la liste
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-[#F2DFC9] px-6 py-12 text-center">
              <p className="text-sm text-gris">Vous n&apos;avez pas encore de liste.</p>
              <Link
                href="/compte/evenements/nouveau"
                className="rounded-lg bg-jaune px-5 py-2.5 text-sm font-medium text-corail-dark"
              >
                Créer ma première liste
              </Link>
            </div>
          )}
        </section>

        <section>
          <div className="rounded-[28px] border-2 border-[#F2DFC9] bg-white p-7">
            <h2 className="font-heading mb-5 text-[22px] font-bold text-[#4A3529]">
              Dernières nouvelles
            </h2>
            <FilActivite activite={activite} />
          </div>
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
            <DeconnexionButton className="text-sm text-[#8A7263] hover:text-corail" />
          </nav>
        </div>
      </footer>
    </div>
  );
}
