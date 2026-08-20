"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPriceCents } from "@/lib/gift-item";
import { hostnameFromUrl } from "@/lib/url";
import { reserveGiftItem } from "@/app/liste/[slug]/reservation-actions";
import ContributionModal from "@/components/gift-items/ContributionModal";
import type { FeeMode } from "@/lib/fee-calculation";
import type { OrganizerStripeStatus } from "@/lib/organizer-stripe-status";
import { estAttenue, sortGiftItems } from "@/lib/gift-item-sort";
import TitreArticle from "@/components/gift-items/TitreArticle";

type GiftItem = {
  id: string;
  title: string;
  original_title: string | null;
  price_cents: number | null;
  image_url: string | null;
  source_url: string | null;
  // Calculés côté serveur (app/liste/[slug]/page.tsx) via getAffiliateLink
  // — jamais recalculés ici, voir le commentaire dans page.tsx (mismatch
  // d'hydratation garanti sinon, AMAZON_ASSOCIATE_TAG n'existe pas côté
  // navigateur).
  affiliate_url: string | null;
  is_affiliate: boolean;
  status: string;
  mode: string;
  funded_amount_cents: number;
  is_priority: boolean;
};

const TONES = ["#F7D9C9", "#F5E3C9", "#DCE7DA"];

export default function ListePubliqueClient({
  eventId,
  slug,
  eventName,
  typeIcon,
  organizerPseudo,
  metaText,
  initialItems,
  feeMode,
  organizerStripeStatus,
}: {
  eventId: string;
  slug: string;
  eventName: string;
  typeIcon: string;
  organizerPseudo: string | null;
  metaText: string;
  initialItems: GiftItem[];
  feeMode: FeeMode;
  organizerStripeStatus: OrganizerStripeStatus;
}) {
  const [items, setItems] = useState(initialItems);
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [modalDone, setModalDone] = useState(false);
  const [contributionItemId, setContributionItemId] = useState<string | null>(null);

  // Retour de la page de paiement Stripe Checkout (succès ou annulation),
  // voir CLAUDE.md > tâche #18.
  const [redirectStatus] = useState<"succeeded" | "failed" | null>(() => {
    if (typeof window === "undefined") return null;
    const status = new URLSearchParams(window.location.search).get("cotisation");
    if (status === "succes") return "succeeded";
    if (status === "annulee") return "failed";
    return null;
  });

  // Retour du lien d'annulation de réservation envoyé par email, voir
  // CLAUDE.md > "Emails transactionnels".
  const [annulationSucces] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("annulation") === "succes";
  });

  useEffect(() => {
    if (!redirectStatus && !annulationSucces) return;
    const url = new URL(window.location.href);
    url.search = "";
    window.history.replaceState({}, "", url.toString());
  }, [redirectStatus, annulationSucces]);

  // Anti-doublon : reflète en direct la réservation faite par un autre
  // invité pendant la consultation, voir CLAUDE.md > tâche #17.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`gift_items-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "gift_items",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const updated = payload.new as {
            id: string;
            status: string;
            mode: string;
            funded_amount_cents: number;
            is_priority: boolean;
          };
          setItems((current) =>
            current.map((item) =>
              item.id === updated.id
                ? {
                    ...item,
                    status: updated.status,
                    mode: updated.mode,
                    funded_amount_cents: updated.funded_amount_cents,
                    is_priority: updated.is_priority,
                  }
                : item,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const availableCount = items.filter((item) => item.status === "disponible").length;
  const sorted = sortGiftItems(items);
  const modalItem = items.find((item) => item.id === modalItemId) ?? null;
  const contributionItem = items.find((item) => item.id === contributionItemId) ?? null;

  // Mobile uniquement (voir mockup "Liste publique mobile v2") : ligne meta
  // à plat plutôt que la ligne "La liste de X" séparée du desktop —
  // aucune fuite si organizerPseudo est vide, même règle que partout
  // ailleurs.
  const metaTextMobile = [metaText, organizerPseudo ? `liste de ${organizerPseudo}` : null]
    .filter(Boolean)
    .join(" · ");
  // eventTypeIcon(null) retombe sur 🎁, jamais utilisé par un vrai type
  // (voir lib/event-types.ts) — sert de repère fiable pour la pastille
  // corail/jaune du mockup mobile, sans prop dédiée.
  const aUnTypePrecis = typeIcon !== "🎁";

  function openModal(itemId: string) {
    setModalItemId(itemId);
    setModalDone(false);
  }

  function closeModal() {
    setModalItemId(null);
    setModalDone(false);
  }

  return (
    <>
      {redirectStatus && (
        <section
          className={`mb-5 rounded-2xl px-5 py-4 text-[15px] font-semibold ${
            redirectStatus === "succeeded"
              ? "bg-[#DCE7DA] text-[#2F4A2C]"
              : "bg-[#F7D9C9] text-corail-dark"
          }`}
        >
          {redirectStatus === "succeeded"
            ? "Votre cotisation a bien été prise en compte, merci !"
            : "Le paiement n'a pas pu être confirmé, votre cotisation n'a pas été prise en compte."}
        </section>
      )}

      {annulationSucces && (
        <section className="mb-5 rounded-2xl bg-[#DCE7DA] px-5 py-4 text-[15px] font-semibold text-[#2F4A2C]">
          Votre réservation a bien été annulée.
        </section>
      )}

      {/* Desktop (voir mockup "Liste publique.dc.html") — inchangé, visible à partir de sm */}
      <section className="mb-7 hidden rounded-[32px] bg-[#F7E7D6] p-9 sm:block">
        <div className="flex flex-wrap items-center gap-5.5">
          <span className="flex h-19 w-19 flex-none items-center justify-center rounded-[26px] bg-corail text-[34px]">
            {typeIcon}
          </span>
          <div className="min-w-60 flex-1">
            <h1 className="font-heading text-[38px] leading-[1.1] font-bold text-[#C0512A]">
              {eventName}
            </h1>
            {organizerPseudo && (
              <p className="text-[15px] font-semibold text-corail">
                La liste de {organizerPseudo}
              </p>
            )}
            <div className="text-[17px] text-[#7A6354]">{metaText}</div>
          </div>
          <div className="rounded-[20px] bg-creme px-5 py-4 text-center">
            <div className="font-heading text-2xl font-bold text-[#2F4A2C]">
              {availableCount}
            </div>
            <div className="text-sm text-[#7A6354]">cadeaux encore libres</div>
          </div>
        </div>
        <p className="mt-5.5 max-w-[640px] text-base leading-relaxed text-[#5C4436]">
          Choisissez un cadeau et réservez-le : il disparaîtra des choix possibles pour les
          autres invités. Pas d&apos;inscription, juste votre prénom.
        </p>
      </section>

      {/* Mobile (voir mockup "Liste publique mobile v2.dc.html") — masqué à partir de sm */}
      <section className="mb-5 rounded-[26px] bg-[#F7E7D6] p-5.5 sm:hidden">
        <div className="mb-4 flex items-center gap-3.5">
          <span
            className={`flex h-14 w-14 flex-none items-center justify-center rounded-[20px] text-[26px] ${
              aUnTypePrecis ? "bg-corail" : "bg-jaune"
            }`}
          >
            {typeIcon}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-[26px] leading-[1.15] font-bold text-[#C0512A]">
              {eventName}
            </h1>
            <div className="text-[15px] leading-snug text-[#7A6354]">{metaTextMobile}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-[18px] bg-creme px-4 py-3.5">
          <span className="font-heading flex-none text-2xl font-bold text-[#2F4A2C]">
            {availableCount}
          </span>
          <span className="text-[15px] leading-snug text-[#5C4436]">
            cadeaux encore libres. Réservez sans créer de compte, juste votre prénom.
          </span>
        </div>
      </section>

      {/* Desktop — cartes en ligne, inchangé */}
      <section className="hidden flex-col gap-4 sm:flex">
        {sorted.map((item, index) => {
          const shop = item.source_url ? hostnameFromUrl(item.source_url) : null;
          const lienArticle = item.affiliate_url;
          const estAffilie = item.is_affiliate;
          const isTaken = item.status === "reserve";
          const isPot = item.status === "cagnotte";
          const canReserve = item.status === "disponible" && item.mode !== "cotisation_obligatoire";
          const canContribute =
            organizerStripeStatus !== "aucun" &&
            item.status !== "reserve" &&
            item.mode !== "cotisation_impossible";
          const rienDisponible = !canReserve && !canContribute && !isTaken;
          const percent =
            isPot && item.price_cents
              ? Math.round((item.funded_amount_cents / item.price_cents) * 100)
              : 0;
          const attenue = estAttenue(item);

          return (
            <article
              key={item.id}
              className={`flex flex-wrap items-center gap-5 rounded-[26px] border-2 p-5 ${
                attenue ? "border-[#EFE3D4] bg-[#FDF3E9] opacity-75" : "border-[#F2DFC9] bg-white"
              }`}
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt=""
                  className="h-24 w-24 flex-none rounded-2xl object-cover"
                />
              ) : (
                <div
                  className="flex h-24 w-24 flex-none items-center justify-center rounded-2xl text-3xl"
                  style={{ background: TONES[index % TONES.length] }}
                >
                  🎁
                </div>
              )}
              <div className="min-w-60 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2.5">
                  <h3 className="contents">
                    <TitreArticle
                      title={item.title}
                      originalTitle={item.original_title}
                      sourceUrl={lienArticle}
                      sponsored={estAffilie}
                      className="font-heading text-lg leading-tight font-bold text-[#4A3529]"
                    />
                  </h3>
                  <span
                    className={`flex-none rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                      isTaken
                        ? "bg-[#F7E7D6] text-[#7A6354]"
                        : isPot
                          ? "bg-[#F5E3C9] text-[#7A5A16]"
                          : "bg-[#DCE7DA] text-[#2F4A2C]"
                    }`}
                  >
                    {isTaken ? "Réservé" : isPot ? "En cagnotte" : "Disponible"}
                  </span>
                </div>
                <div className="text-base font-semibold text-[#5C4436]">
                  {formatPriceCents(item.price_cents)}
                </div>
                {shop && (
                  <div className="text-sm text-[#8A7263]">
                    {shop}
                    {estAffilie && (
                      <span className="text-[#A08D7E]">
                        {" "}
                        · lien affilié — Kdovie peut percevoir une commission, sans coût
                        supplémentaire pour vous
                      </span>
                    )}
                  </div>
                )}

                {isPot && (
                  <div className="mt-2 max-w-90">
                    <div className="mb-1.5 h-2.5 overflow-hidden rounded-full bg-[#F7E7D6]">
                      <div
                        className="h-2.5 rounded-full bg-sauge"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#7A6354]">
                      <span>
                        {formatPriceCents(item.funded_amount_cents)}
                        {item.price_cents !== null
                          ? ` sur ${formatPriceCents(item.price_cents)}`
                          : " réunis"}
                      </span>
                      {organizerStripeStatus === "en_attente" && (
                        <span className="rounded-full bg-[#F5E3C9] px-2.5 py-0.5 text-[13px] font-semibold text-[#7A5A16]">
                          Cagnotte en validation
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-none flex-col items-stretch gap-2">
                {canReserve && (
                  <button
                    type="button"
                    onClick={() => openModal(item.id)}
                    className="font-heading rounded-2xl bg-corail px-5 py-3.5 text-base font-bold text-creme hover:bg-[#D45F37]"
                  >
                    Je réserve
                  </button>
                )}
                {canContribute && (
                  <button
                    type="button"
                    onClick={() => setContributionItemId(item.id)}
                    className={`font-heading rounded-2xl px-5 py-3.5 text-base font-bold ${
                      canReserve
                        ? "bg-creme text-[#5C4436] hover:bg-white"
                        : "bg-corail text-creme hover:bg-[#D45F37]"
                    }`}
                  >
                    Je cotise
                  </button>
                )}
                {isTaken && (
                  <div className="rounded-2xl bg-[#DCE7DA] px-5 py-3.5 text-center text-[15px] font-semibold text-[#2F4A2C]">
                    Déjà réservé
                  </div>
                )}
                {rienDisponible && (
                  <div className="rounded-2xl bg-creme px-5 py-3.5 text-center text-[15px] text-[#7A6354]">
                    Cagnotte bientôt disponible
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Mobile (voir mockup "Liste publique mobile v3.dc.html") — cartes
          blanches classiques (photo en bandeau fixe au-dessus, contenu en
          texte sombre en dessous), plus proche du langage visuel desktop
          qu'un empilement vertical. Remplace la v2 (carte "poster" plein
          format, texte clair sur dégradé sombre). Mêmes états fonctionnels
          que la version desktop (canReserve/canContribute/isTaken/
          rienDisponible), juste une autre présentation. */}
      <section className="flex flex-col gap-4 sm:hidden">
        {sorted.map((item, index) => {
          const shop = item.source_url ? hostnameFromUrl(item.source_url) : null;
          const lienArticle = item.affiliate_url;
          const estAffilie = item.is_affiliate;
          const isTaken = item.status === "reserve";
          const isPot = item.status === "cagnotte";
          const canReserve = item.status === "disponible" && item.mode !== "cotisation_obligatoire";
          const canContribute =
            organizerStripeStatus !== "aucun" &&
            item.status !== "reserve" &&
            item.mode !== "cotisation_impossible";
          const rienDisponible = !canReserve && !canContribute && !isTaken;
          const percent =
            isPot && item.price_cents
              ? Math.round((item.funded_amount_cents / item.price_cents) * 100)
              : 0;
          const attenue = estAttenue(item);
          const tone = TONES[index % TONES.length];

          return (
            <article
              key={item.id}
              className="overflow-hidden rounded-[24px] border-2 border-[#F2DFC9] bg-white"
              style={{ opacity: attenue ? 0.8 : 1 }}
            >
              <div className="relative h-[230px]" style={{ background: tone }}>
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <span
                  className={`absolute top-3.5 left-3.5 z-10 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                    isTaken
                      ? "bg-creme text-[#7A6354]"
                      : isPot
                        ? "bg-[#F5E3C9] text-[#7A5A16]"
                        : "bg-[#DCE7DA] text-[#2F4A2C]"
                  }`}
                >
                  {isTaken ? "Réservé" : isPot ? "En cagnotte" : "Disponible"}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 p-4.5 pt-4">
                <h3 className="contents">
                  <TitreArticle
                    title={item.title}
                    originalTitle={item.original_title}
                    sourceUrl={lienArticle}
                    sponsored={estAffilie}
                    className="font-heading text-xl leading-snug font-bold text-[#4A3529]"
                  />
                </h3>
                <div className="flex flex-wrap items-baseline gap-2.5">
                  <span className="font-heading text-[19px] font-bold text-[#C0512A]">
                    {formatPriceCents(item.price_cents)}
                  </span>
                  {shop && (
                    <span className="truncate text-sm text-[#8A7263]">
                      {shop}
                      {estAffilie && " · lien affilié"}
                    </span>
                  )}
                </div>

                {isPot && (
                  <div>
                    <div className="mb-1.5 h-2.5 overflow-hidden rounded-full bg-[#F7E7D6]">
                      <div
                        className="h-2.5 rounded-full bg-sauge"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#7A6354]">
                      <span>
                        {formatPriceCents(item.funded_amount_cents)}
                        {item.price_cents !== null
                          ? ` sur ${formatPriceCents(item.price_cents)}`
                          : " réunis"}
                      </span>
                      {organizerStripeStatus === "en_attente" && (
                        <span className="rounded-full bg-[#F5E3C9] px-2.5 py-0.5 text-[13px] font-semibold text-[#7A5A16]">
                          Cagnotte en validation
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {canReserve && (
                  <button
                    type="button"
                    onClick={() => openModal(item.id)}
                    className="mt-0.5 min-h-12 w-full rounded-2xl bg-corail py-3.5 font-heading text-base font-bold text-creme hover:bg-[#D45F37]"
                  >
                    Je réserve
                  </button>
                )}
                {canContribute && (
                  <button
                    type="button"
                    onClick={() => setContributionItemId(item.id)}
                    className={`mt-0.5 min-h-12 w-full rounded-2xl py-3.5 font-heading text-base font-bold ${
                      canReserve
                        ? "bg-creme text-[#5C4436] hover:bg-[#F7E7D6]"
                        : "bg-corail text-creme hover:bg-[#D45F37]"
                    }`}
                  >
                    Je cotise
                  </button>
                )}
                {isTaken && (
                  <div className="mt-0.5 rounded-2xl bg-[#DCE7DA] py-3.5 text-center text-[15px] font-semibold text-[#2F4A2C]">
                    Déjà réservé
                  </div>
                )}
                {rienDisponible && (
                  <div className="mt-0.5 rounded-2xl bg-creme py-3.5 text-center text-[15px] text-[#7A6354]">
                    Cagnotte bientôt disponible
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {modalItem && (
        <ReservationModal
          item={modalItem}
          slug={slug}
          done={modalDone}
          onDone={() => setModalDone(true)}
          onClose={closeModal}
        />
      )}

      {contributionItem && (
        <ContributionModal
          item={contributionItem}
          slug={slug}
          feeMode={feeMode}
          cagnotteEnValidation={organizerStripeStatus === "en_attente"}
          onClose={() => setContributionItemId(null)}
        />
      )}
    </>
  );
}

function ReservationModal({
  item,
  slug,
  done,
  onDone,
  onClose,
}: {
  item: GiftItem;
  slug: string;
  done: boolean;
  onDone: () => void;
  onClose: () => void;
}) {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function handleNomChange(event: ChangeEvent<HTMLInputElement>) {
    setNom(event.target.value);
  }

  const lienAchat = item.affiliate_url;
  const achatAffilie = item.is_affiliate;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setIsPending(true);
    const result = await reserveGiftItem(item.id, slug, nom, email);
    setIsPending(false);
    if (result.error) {
      setErreur(result.error);
      return;
    }
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-[#4A3529]/45 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-t-[28px] bg-creme p-6 pb-8 sm:rounded-[32px] sm:p-8.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.25 w-11 rounded-full bg-[#F2DFC9] sm:hidden" />
        {!done ? (
          <div>
            <div className="mb-1.5 flex items-start justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold text-[#C0512A]">
                Je réserve ce cadeau
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-[15px] font-semibold text-[#8A7263]"
              >
                Fermer
              </button>
            </div>
            <p className="mb-5.5 text-base text-[#7A6354]">
              {item.title} · {formatPriceCents(item.price_cents)}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
              <label className="flex flex-col gap-2">
                <span className="font-heading text-base font-bold text-[#4A3529]">
                  Prénom et nom{" "}
                  <span className="text-sm font-medium text-[#8A7263]">— facultatif</span>
                </span>
                <input
                  type="text"
                  value={nom}
                  onChange={handleNomChange}
                  placeholder="Sophie Martin"
                  className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="font-heading text-base font-bold text-[#4A3529]">
                  E-mail{" "}
                  <span className="text-sm font-medium text-[#8A7263]">— facultatif</span>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="sophie@email.fr"
                  className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
                />
                <span className="text-sm text-[#8A7263]">
                  Surtout utile pour pouvoir annuler votre réservation si besoin — ce sera le
                  seul moyen d&apos;y parvenir.
                </span>
              </label>
              {erreur && <p className="text-sm text-corail-dark">{erreur}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="font-heading w-full rounded-2xl bg-corail py-4.5 text-lg font-bold text-creme disabled:opacity-60"
              >
                {isPending ? "Envoi…" : "Confirmer la réservation"}
              </button>
              <span className="text-center text-sm text-[#8A7263]">
                Aucun compte à créer.
              </span>
            </form>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#DCE7DA] text-[28px]">
              🎁
            </div>
            <h2 className="font-heading mb-2.5 text-2xl font-bold text-[#2F4A2C]">
              C&apos;est réservé, merci !
            </h2>
            <p className="mb-6 text-base leading-relaxed text-[#5C4436]">
              « {item.title} » est maintenant réservé à votre nom. Les autres invités ne le
              verront plus dans la liste.
            </p>
            <div className="flex flex-wrap items-start justify-center gap-3">
              {lienAchat && (
                <div className="flex flex-col items-center gap-1.5">
                  <a
                    href={lienAchat}
                    target="_blank"
                    rel={achatAffilie ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                    className="font-heading rounded-2xl bg-corail px-6.5 py-4 text-base font-bold text-creme hover:bg-[#D45F37]"
                  >
                    Aller l&apos;acheter
                  </a>
                  {achatAffilie && (
                    <span className="max-w-55 text-center text-xs text-[#A08D7E]">
                      Lien affilié — Kdovie peut percevoir une commission, sans coût
                      supplémentaire pour vous
                    </span>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="font-heading rounded-2xl bg-creme px-6.5 py-4 text-base font-bold text-[#5C4436] hover:bg-white"
              >
                Revenir à la liste
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
