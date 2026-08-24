"use client";

import { useEffect, useState } from "react";
import { useLinkStatus } from "next/link";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

// Indicateur de navigation localisé au lien cliqué — voir CLAUDE.md >
// "Indicateur de navigation localisé au lien cliqué, avec useLinkStatus".
// Doit être posé comme enfant d'un <Link> (jamais sur Link lui-même) :
// ex. <Link href="/compte">Mes listes<StatutLien /></Link>.
//
// Toujours rendu (jamais {pending && <KdovieSpinner />}) pour ne jamais
// provoquer de saut de mise en page — seule l'opacité varie, avec un léger
// délai avant d'apparaître pour ne pas clignoter sur une navigation déjà
// quasi instantanée (recommandation officielle Next.js pour useLinkStatus).
export default function StatutLien({
  variant = "light",
  className = "ml-2 h-3.5 w-3.5",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const { pending } = useLinkStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!pending) return;
    const timeout = setTimeout(() => setVisible(true), 150);
    return () => {
      clearTimeout(timeout);
      setVisible(false);
    };
  }, [pending]);

  return (
    <span
      className={`inline-block align-middle transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <KdovieSpinner className={className} variant={variant} />
    </span>
  );
}
