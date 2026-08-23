import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Garde-fou unique pour tout /admin/* : 404 (pas de redirection) pour ne
// rien laisser deviner de ces routes à un compte non-admin — remplace la
// vérification autrefois répétée dans chaque page.tsx. Voir CLAUDE.md >
// "Refonte du dashboard super-administrateur". Chaque Server Action
// re-vérifie is_admin indépendamment, jamais confié au seul gate ici.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("app_settings")
    .select("maintenance_mode")
    .eq("id", 1)
    .single();

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <AdminSidebar initialMaintenanceEnabled={settings?.maintenance_mode ?? false} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
