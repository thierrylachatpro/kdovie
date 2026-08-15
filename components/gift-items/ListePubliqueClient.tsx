"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatPriceCents,
  giftItemStatusClassName,
  giftItemStatusLabel,
} from "@/lib/gift-item";
import ReservationBlock from "@/components/gift-items/ReservationBlock";

type GiftItem = {
  id: string;
  title: string;
  price_cents: number | null;
  image_url: string | null;
  status: string;
  mode: string;
};

export default function ListePubliqueClient({
  eventId,
  slug,
  initialItems,
}: {
  eventId: string;
  slug: string;
  initialItems: GiftItem[];
}) {
  const [items, setItems] = useState(initialItems);

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
          const updated = payload.new as { id: string; status: string; mode: string };
          setItems((current) =>
            current.map((item) =>
              item.id === updated.id
                ? { ...item, status: updated.status, mode: updated.mode }
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

  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-gris">
        Cette liste ne contient pas encore d&apos;article.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
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
          <ReservationBlock
            itemId={item.id}
            slug={slug}
            status={item.status}
            mode={item.mode}
          />
        </li>
      ))}
    </ul>
  );
}
