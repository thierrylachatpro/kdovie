import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccueilClient from "@/components/accueil/AccueilClient";

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
