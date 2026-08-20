"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// CRUD organisateurs pour le super-administrateur — voir CLAUDE.md >
// "Dashboard super-administrateur". Re-vérifie is_admin ici, jamais confié
// au seul gate de app/admin/organisateurs/page.tsx (même pattern que
// restoreEvent dans app/admin/actions.ts).
export async function updateOrganizerPseudo(
  userId: string,
  pseudo: string,
): Promise<{ error: string | null }> {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    return { error: "Accès refusé." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ display_name: pseudo.trim() || null })
    .eq("id", userId);

  if (!error) {
    revalidatePath("/admin/organisateurs");
  }

  return { error: error?.message ?? null };
}

// Désactivation réversible (profiles.disabled, migration 0019) — bloque la
// connexion sans rien supprimer, contrairement à cleanup-organizer.mjs qui
// reste le seul moyen de suppression réelle pour l'instant.
export async function setOrganizerDisabled(
  userId: string,
  disabled: boolean,
): Promise<{ error: string | null }> {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    return { error: "Accès refusé." };
  }

  if (disabled) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id === userId) {
      return { error: "Vous ne pouvez pas désactiver votre propre compte." };
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ disabled }).eq("id", userId);

  if (!error) {
    revalidatePath("/admin/organisateurs");
  }

  return { error: error?.message ?? null };
}
