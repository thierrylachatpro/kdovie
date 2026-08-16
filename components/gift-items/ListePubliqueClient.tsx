"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPriceCents } from "@/lib/gift-item";
import { hostnameFromUrl } from "@/lib/url";
import { reserveGiftItem } from "@/app/liste/[slug]/reservation-actions";

type GiftItem = {
  id: string;
  title: string;
  price_cents: number | null;
  image_url: string | null;
  source_url: string;
  status: string;
  mode: string;
  funded_amount_cents: number;
};

const TONES = ["#F7D9C9", "#F5E3C9", "#DCE7DA"];

export default function ListePubliqueClient({
  eventId,
  slug,
  eventName,
  typeIcon,
  metaText,
  initialItems,
}: {
  eventId: string;
  slug: string;
  eventName: string;
  typeIcon: string;
  metaText: string;
  initialItems: GiftItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [modalItemId, setModalItemId] = useState<string | null>(null);
  const [modalDone, setModalDone] = useState(false);

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
          };
          setItems((current) =>
            current.map((item) =>
              item.id === updated.id
                ? {
                    ...item,
                    status: updated.status,
                    mode: updated.mode,
                    funded_amount_cents: updated.funded_amount_cents,
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
  const sorted = [...items].sort(
    (a, b) => (a.status === "reserve" ? 1 : 0) - (b.status === "reserve" ? 1 : 0),
  );
  const modalItem = items.find((item) => item.id === modalItemId) ?? null;

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
      <section className="mb-7 rounded-[32px] bg-[#F7E7D6] p-9">
        <div className="flex flex-wrap items-center gap-5.5">
          <span className="flex h-19 w-19 flex-none items-center justify-center rounded-[26px] bg-corail text-[34px]">
            {typeIcon}
          </span>
          <div className="min-w-60 flex-1">
            <h1 className="font-heading text-[38px] leading-[1.1] font-bold text-[#C0512A]">
              {eventName}
            </h1>
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

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((item, index) => {
          const shop = hostnameFromUrl(item.source_url);
          const isTaken = item.status === "reserve";
          const isPot = item.status === "cagnotte";
          const canReserve = item.status === "disponible" && item.mode !== "cotisation_obligatoire";
          const enAttenteCagnotte = !canReserve && !isTaken && !isPot;
          const percent =
            isPot && item.price_cents
              ? Math.round((item.funded_amount_cents / item.price_cents) * 100)
              : 0;

          return (
            <article
              key={item.id}
              className={`flex flex-col overflow-hidden rounded-[26px] border-2 border-[#F2DFC9] bg-white ${isTaken ? "opacity-75" : ""}`}
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt=""
                  className="h-[150px] w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-[150px] items-center justify-center text-4xl"
                  style={{ background: TONES[index % TONES.length] }}
                >
                  🎁
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-heading text-lg leading-tight font-bold text-[#4A3529]">
                    {item.title}
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
                {shop && <div className="text-sm text-[#8A7263]">{shop}</div>}

                {isPot && (
                  <div>
                    <div className="mb-1.5 h-2.5 overflow-hidden rounded-full bg-[#F7E7D6]">
                      <div
                        className="h-2.5 rounded-full bg-sauge"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <div className="text-sm text-[#7A6354]">{percent} % réunis</div>
                  </div>
                )}

                <div className="mt-auto pt-1.5">
                  {canReserve && (
                    <button
                      type="button"
                      onClick={() => openModal(item.id)}
                      className="font-heading w-full rounded-2xl bg-corail px-4 py-3.5 text-base font-bold text-creme hover:bg-[#D45F37]"
                    >
                      Je réserve
                    </button>
                  )}
                  {isTaken && (
                    <div className="rounded-2xl bg-[#DCE7DA] px-4 py-3.5 text-center text-[15px] font-semibold text-[#2F4A2C]">
                      Déjà réservé
                    </div>
                  )}
                  {(isPot || enAttenteCagnotte) && (
                    <div className="rounded-2xl bg-creme px-4 py-3.5 text-center text-[15px] text-[#7A6354]">
                      Cagnotte bientôt disponible
                    </div>
                  )}
                </div>
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
  const [touched, setTouched] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const nomValide = nom.trim().length >= 2;

  function handleNomChange(event: ChangeEvent<HTMLInputElement>) {
    setNom(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nomValide) {
      setTouched(true);
      return;
    }
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
      className="fixed inset-0 z-20 flex items-center justify-center bg-[#4A3529]/45 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-[32px] bg-creme p-8.5"
        onClick={(event) => event.stopPropagation()}
      >
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
                  Prénom et nom
                </span>
                <input
                  type="text"
                  value={nom}
                  onChange={handleNomChange}
                  placeholder="Sophie Martin"
                  className={`w-full rounded-[18px] border-2 bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune ${
                    touched && !nomValide ? "border-corail" : "border-[#F2DFC9]"
                  }`}
                />
                {touched && !nomValide && (
                  <span className="text-sm text-corail-dark">
                    Indiquez votre prénom et votre nom, pour que l&apos;organisateur sache qui a
                    réservé.
                  </span>
                )}
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
                  Uniquement pour recevoir la confirmation de votre réservation.
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
                Aucun compte à créer. L&apos;organisateur ne verra pas votre choix avant
                l&apos;événement.
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
            <button
              type="button"
              onClick={onClose}
              className="font-heading rounded-2xl bg-corail px-6.5 py-4 text-base font-bold text-creme"
            >
              Revenir à la liste
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
