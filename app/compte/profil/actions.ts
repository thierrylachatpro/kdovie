"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const displayName = formData.get("display_name")?.toString().trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    redirect("/compte/profil?erreur=1");
  }

  revalidatePath("/compte/profil");
  revalidatePath("/compte");
  redirect("/compte/profil?succes=1");
}
