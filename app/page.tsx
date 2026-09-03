import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_DESCRIPTION, pageMetadata } from "@/lib/seo";
import AccueilClient from "@/components/accueil/AccueilClient";

// Pas de `title` : hérite du title.default de app/layout.tsx (titre complet de
// la marque, non templaté) — c'est la page racine.
export const metadata: Metadata = pageMetadata({
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Un organisateur déjà connecté ne voit plus le contenu marketing sur "/"
  // — voir CLAUDE.md > "Redirection automatique vers /compte pour un
  // organisateur connecté". Avant tout calcul de pseudo/rendu, inutile de
  // faire la requête profiles si on redirige de toute façon.
  if (user) {
    redirect("/compte");
  }

  return <AccueilClient estConnecte={false} pseudo={null} />;
}
