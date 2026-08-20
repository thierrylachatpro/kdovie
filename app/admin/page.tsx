import Link from "next/link";
import { notFound } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import RestaurerButton from "@/components/admin/RestaurerButton";
import MaintenanceToggle from "@/components/admin/MaintenanceToggle";

// Réservé aux comptes profiles.is_admin = true — 404 plutôt que redirection
// pour ne rien laisser deviner de cette route à un compte non-admin. Voir
// CLAUDE.md > "Dashboard super-administrateur". Périmètre volontairement
// minimal : uniquement les listes supprimées (deleted_at renseigné) et leur
// restauration, pas de vue globale sur le reste du produit.
export default async function AdminPage() {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    notFound();
  }

  const admin = createAdminClient();
  const { data: events } = await admin
    .from("events")
    .select("id, name, slug, deleted_at, organizer_id, profiles(display_name)")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  const { data: settings } = await admin
    .from("app_settings")
    .select("maintenance_mode")
    .eq("id", 1)
    .single();

  return (
    <div className="mx-auto max-w-[900px] px-6 py-10">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold text-corail">Administration</h1>
        <Link
          href="/admin/organisateurs"
          className="text-sm font-semibold text-[#8A7263] underline hover:text-corail-dark"
        >
          Organisateurs
        </Link>
      </div>

      <MaintenanceToggle initialEnabled={settings?.maintenance_mode ?? false} />

      <h2 className="mb-2 font-heading text-2xl font-bold text-corail">Listes supprimées</h2>
      <p className="mb-7 text-[15px] text-[#7A6354]">
        Restaurer une liste la rend à nouveau visible dans le tableau de bord de son
        organisateur d&apos;origine.
      </p>

      {(events ?? []).length === 0 ? (
        <p className="text-sm text-gris">Aucune liste supprimée pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(events ?? []).map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#F2DFC9] bg-white p-5"
            >
              <div className="min-w-0">
                <div className="font-heading text-lg font-bold text-[#4A3529]">{event.name}</div>
                <div className="text-sm text-[#8A7263]">
                  /liste/{event.slug} · organisateur :{" "}
                  {event.profiles?.display_name ?? event.organizer_id} · supprimée le{" "}
                  {event.deleted_at
                    ? new Date(event.deleted_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : ""}
                </div>
              </div>
              <RestaurerButton eventId={event.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
