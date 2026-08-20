import Link from "next/link";
import { notFound } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import OrganisateurCard from "@/components/admin/OrganisateurCard";

// CRUD organisateurs (lecture, modification du pseudo, désactivation
// réversible) — voir CLAUDE.md > "Dashboard super-administrateur". Pas de
// création de compte depuis ce dashboard (décision explicite) ni de
// suppression réelle (cleanup-organizer.mjs reste le seul moyen, réservé à
// un usage manuel en ligne de commande).
export default async function AdminOrganisateursPage() {
  const estAdmin = await isCurrentUserAdmin();
  if (!estAdmin) {
    notFound();
  }

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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold text-corail">Organisateurs</h1>
        <Link
          href="/admin"
          className="text-sm font-semibold text-[#8A7263] underline hover:text-corail-dark"
        >
          Listes supprimées
        </Link>
      </div>
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
