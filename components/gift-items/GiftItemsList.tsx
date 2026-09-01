"use client";

import { useState, useTransition, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderGiftItems } from "@/app/compte/evenements/[slug]/gift-item-actions";
import GiftItemCard from "@/components/gift-items/GiftItemCard";

type Item = {
  id: string;
  title: string;
  original_title: string | null;
  price_cents: number | null;
  image_url: string | null;
  description: string | null;
  source_url: string | null;
  status: string;
  mode: string;
  funded_amount_cents: number;
  position: number;
};

function GripIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      fill="currentColor"
    >
      <circle cx="5.5" cy="3.5" r="1.4" />
      <circle cx="10.5" cy="3.5" r="1.4" />
      <circle cx="5.5" cy="8" r="1.4" />
      <circle cx="10.5" cy="8" r="1.4" />
      <circle cx="5.5" cy="12.5" r="1.4" />
      <circle cx="10.5" cy="12.5" r="1.4" />
    </svg>
  );
}

function SortableRow({
  item,
  disabled,
  children,
}: {
  item: Item;
  disabled: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-stretch gap-2 sm:gap-3 ${
        isDragging ? "relative z-10 opacity-90" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={`Déplacer « ${item.title} » dans la liste`}
        title={
          disabled
            ? "Terminez la modification en cours pour réordonner"
            : "Glisser pour déplacer"
        }
        className="flex w-9 flex-none cursor-grab touch-none items-center justify-center rounded-2xl border-2 border-[#F2DFC9] bg-white text-[#B79C86] transition-colors hover:border-corail hover:text-corail active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 sm:w-11"
      >
        <GripIcon />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

export default function GiftItemsList({
  items: initialItems,
  slug,
  reservedNames,
  contributorNames,
}: {
  items: Item[];
  slug: string;
  reservedNames: Record<string, string | null>;
  contributorNames: Record<string, (string | null)[]>;
}) {
  const [items, setItems] = useState(initialItems);
  const [prevInitial, setPrevInitial] = useState(initialItems);
  const [erreur, setErreur] = useState<string | null>(null);
  const [editingIds, setEditingIds] = useState<Set<string>>(() => new Set());
  const [, startTransition] = useTransition();

  // Resynchronise l'ordre local sur celui du serveur après une revalidation
  // (ajout, modification, suppression d'un cadeau) — pattern React officiel de
  // remise à zéro d'un état quand une prop change, en phase de rendu.
  if (initialItems !== prevInitial) {
    setPrevInitial(initialItems);
    setItems(initialItems);
  }

  const anyEditing = editingIds.size > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function titre(id: string | number) {
    return items.find((i) => i.id === id)?.title ?? "ce cadeau";
  }
  function rang(id: string | number) {
    return items.findIndex((i) => i.id === id) + 1;
  }

  const screenReaderInstructions = {
    draggable:
      "Appuyez sur Espace pour attraper le cadeau, utilisez les flèches haut et bas pour le déplacer, Espace à nouveau pour le déposer, Échap pour annuler.",
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Cadeau « ${titre(active.id)} » saisi.`,
    onDragOver: ({ active, over }) =>
      over
        ? `« ${titre(active.id)} » déplacé en position ${rang(over.id)} sur ${items.length}.`
        : "",
    onDragEnd: ({ active, over }) =>
      over
        ? `« ${titre(active.id)} » déposé en position ${rang(over.id)} sur ${items.length}.`
        : `Déplacement de « ${titre(active.id)} » annulé.`,
    onDragCancel: ({ active }) =>
      `Déplacement de « ${titre(active.id)} » annulé.`,
  };

  function handleEditingChange(id: string, editing: boolean) {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (editing) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    setErreur(null);

    startTransition(async () => {
      const result = await reorderGiftItems(
        slug,
        next.map((i) => i.id),
      );
      if (result.error) {
        setItems(previous);
        setErreur(result.error);
      }
    });
  }

  return (
    <div>
      {erreur && <p className="mb-3 text-sm text-corail-dark">{erreur}</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
        accessibility={{ announcements, screenReaderInstructions }}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-4">
            {items.map((item, index) => (
              <SortableRow key={item.id} item={item} disabled={anyEditing}>
                <GiftItemCard
                  item={item}
                  slug={slug}
                  toneIndex={index}
                  reservedByName={reservedNames[item.id] ?? null}
                  contributorNames={contributorNames[item.id] ?? []}
                  onEditingChange={(editing) => handleEditingChange(item.id, editing)}
                />
              </SortableRow>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
