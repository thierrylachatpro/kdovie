import { createClient } from "@/lib/supabase/server";
import AccueilClient from "@/components/accueil/AccueilClient";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <AccueilClient estConnecte={Boolean(user)} />;
}
