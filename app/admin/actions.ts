"use server";

import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Restaure une liste supprimée (deleted_at -> null) — seul moyen de
// restauration, l'organisateur n'en a aucun de son côté. Écriture via
// service_role (RLS n'autoriserait pas un admin à modifier la liste d'un
// autre organisateur), avec re-vérification is_admin ici, jamais confiée
// au seul gate de app/admin/page.tsx. Voir CLAUDE.md > "Dashboard
// super-administrateur".
export async function restoreEvent(eventId: string): Promise<{ error: string | null }> {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    return { error: "Accès refusé." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("events").update({ deleted_at: null }).eq("id", eventId);

  if (!error) {
    revalidatePath("/admin");
  }

  return { error: error?.message ?? null };
}

// Bascule le site en/hors mode maintenance (app_settings.maintenance_mode,
// migration 0020) — lu par proxy.ts à chaque requête, effet instantané sans
// redéploiement. Voir CLAUDE.md > "Bouton admin pour basculer le mode
// maintenance".
export async function setMaintenanceMode(enabled: boolean): Promise<{ error: string | null }> {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    return { error: "Accès refusé." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .update({ maintenance_mode: enabled })
    .eq("id", 1);

  if (!error) {
    revalidatePath("/admin");
  }

  return { error: error?.message ?? null };
}
