import { createAdminClient } from "@/lib/supabase/admin";
import OrganisateurCard from "@/components/admin/OrganisateurCard";

// CRUD organisateurs (lecture, modification du pseudo, désactivation
// réversible) — voir CLAUDE.md > "Dashboard super-administrateur". Pas de
// création de compte depuis ce dashboard (décision explicite) ni de
// suppression réelle (cleanup-organizer.mjs reste le seul moyen, réservé à
// un usage manuel en ligne de commande). Le garde-fou is_admin vit dans
// app/admin/layout.tsx, plus besoin de le répéter ici.
export default async function AdminOrganisateursPage() {
  const admin = createAdminClient();

  const [{ data: profiles }, { data: usersData }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, display_name, is_admin, disabled, created_at")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));

  const organisateurs = (profiles ?? []).map((profile) => {
    const authUser = usersById.get(profile.id);
    return {
      ...profile,
      email: authUser?.email ?? "—",
      lastSignInAt: authUser?.last_sign_in_at ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="font-heading mb-2 text-3xl font-bold text-corail">Organisateurs</h1>
      <p className="mb-7 text-[15px] text-[#7A6354]">
        {organisateurs.length} compte{organisateurs.length > 1 ? "s" : ""} organisateur
        {organisateurs.length > 1 ? "s" : ""}.
      </p>

      {organisateurs.length === 0 ? (
        <p className="text-sm text-gris">Aucun organisateur pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {organisateurs.map((o) => (
            <OrganisateurCard
              key={o.id}
              userId={o.id}
              email={o.email}
              pseudo={o.display_name}
              createdAt={o.created_at}
              lastSignInAt={o.lastSignInAt ?? null}
              disabled={o.disabled}
              isAdmin={o.is_admin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
