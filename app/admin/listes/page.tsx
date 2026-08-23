import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ListeAdminCard from "@/components/admin/ListeAdminCard";

// Vue sur TOUTES les listes, tous organisateurs confondus (remplace
// l'ancien contenu de /admin qui ne montrait que les listes supprimées) —
// voir CLAUDE.md > "Refonte du dashboard super-administrateur" > "Section
// Listes". Le garde-fou is_admin vit dans app/admin/layout.tsx.
export default async function AdminListesPage({ searchParams }: PageProps<"/admin/listes">) {
  const params = await searchParams;
  const qParam = params.q;
  const q = typeof qParam === "string" ? qParam.trim().toLowerCase() : "";

  const admin = createAdminClient();

  const [{ data: events }, { data: usersData }, { data: contributions }] = await Promise.all([
    admin
      .from("events")
      .select(
        "id, name, slug, status, deleted_at, organizer_id, created_at, profiles(display_name)",
      )
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("contributions").select("amount_cents, gift_items(event_id)").eq("status", "succeeded"),
  ]);

  const usersById = new Map((usersData?.users ?? []).map((u) => [u.id, u]));

  const montantParEvent = new Map<string, number>();
  for (const contribution of contributions ?? []) {
    const eventId = contribution.gift_items?.event_id;
    if (!eventId) continue;
    montantParEvent.set(eventId, (montantParEvent.get(eventId) ?? 0) + contribution.amount_cents);
  }

  const listes = (events ?? []).map((event) => {
    const authUser = usersById.get(event.organizer_id);
    return {
      id: event.id,
      name: event.name,
      slug: event.slug,
      status: event.status,
      deleted_at: event.deleted_at,
      created_at: event.created_at,
      organizerEmail: authUser?.email ?? "—",
      organizerPseudo: event.profiles?.display_name ?? null,
      montantCotiseCents: montantParEvent.get(event.id) ?? 0,
    };
  });

  const listesFiltrees = q
    ? listes.filter(
        (liste) =>
          liste.name.toLowerCase().includes(q) || liste.organizerEmail.toLowerCase().includes(q),
      )
    : listes;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="font-heading mb-2 text-3xl font-bold text-corail">Listes</h1>
      <p className="mb-5 text-[15px] text-[#7A6354]">
        {listesFiltrees.length} liste{listesFiltrees.length > 1 ? "s" : ""}
        {q ? ` pour « ${q} »` : ""} sur {listes.length} au total.
      </p>

      <form className="mb-7 flex flex-wrap gap-2.5">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Nom de liste ou email de l'organisateur"
          className="w-full max-w-100 rounded-2xl border-2 border-[#F2DFC9] bg-white px-4 py-2.5 text-[15px] text-[#4A3529] outline-none focus:border-corail"
        />
        <button
          type="submit"
          className="rounded-2xl bg-[#F7E7D6] px-4 py-2.5 text-[14px] font-semibold text-[#5C4436] hover:bg-[#F2DFC9]"
        >
          Filtrer
        </button>
        {q && (
          <Link
            href="/admin/listes"
            className="inline-flex items-center px-2 text-sm font-semibold text-[#8A7263] underline"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {listesFiltrees.length === 0 ? (
        <p className="text-sm text-gris">Aucune liste ne correspond.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {listesFiltrees.map((liste) => (
            <ListeAdminCard key={liste.id} liste={liste} />
          ))}
        </div>
      )}
    </div>
  );
}
