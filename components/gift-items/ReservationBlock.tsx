"use client";

import { useState, useTransition, type FormEvent } from "react";
import { reserveGiftItem } from "@/app/liste/[slug]/reservation-actions";

export default function ReservationBlock({
  itemId,
  slug,
  status,
  mode,
}: {
  itemId: string;
  slug: string;
  status: string;
  mode: string;
}) {
  const [phase, setPhase] = useState<"idle" | "form" | "confirmed">("idle");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (phase === "confirmed") {
    return <p className="text-sm font-medium text-sauge-dark">Merci, c&apos;est noté !</p>;
  }

  const eligible = status === "disponible" && mode !== "cotisation_obligatoire";
  if (!eligible) {
    return null;
  }

  if (phase === "idle") {
    return (
      <button
        type="button"
        onClick={() => setPhase("form")}
        className="self-start rounded-lg bg-jaune px-4 py-2 text-sm font-medium text-corail-dark"
      >
        Réserver
      </button>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    startTransition(async () => {
      const result = await reserveGiftItem(itemId, slug, nom, email);
      if (result.error) {
        setErreur(result.error);
      } else {
        setPhase("confirmed");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-lg border border-gris/20 bg-creme p-3"
    >
      <label className="flex flex-col gap-1 text-xs text-gris">
        Prénom et nom
        <input
          type="text"
          required
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          className="rounded-lg border border-gris/30 bg-white px-3 py-1.5 text-sm outline-none focus:border-corail"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gris">
        Email (optionnel)
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-gris/30 bg-white px-3 py-1.5 text-sm outline-none focus:border-corail"
        />
      </label>
      {erreur && <p className="text-xs text-corail-dark">{erreur}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-jaune px-4 py-1.5 text-sm font-medium text-corail-dark disabled:opacity-50"
        >
          {isPending ? "Envoi…" : "Confirmer"}
        </button>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          disabled={isPending}
          className="rounded-lg px-4 py-1.5 text-sm text-gris disabled:opacity-50"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
