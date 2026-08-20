import { createClient } from "@/lib/supabase/server";
import AccueilClient from "@/components/accueil/AccueilClient";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pseudo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    pseudo = profile?.display_name?.trim() || user.email?.split("@")[0] || null;
  }

  return <AccueilClient estConnecte={Boolean(user)} pseudo={pseudo} />;
}
