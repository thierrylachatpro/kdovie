import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPriceCents } from "@/lib/gift-item";
import {
  computeApplicationFeeAmountCents,
  computeMontantPreleveCents,
  type FeeMode,
} from "@/lib/fee-calculation";

// Vue sur toutes les cotisations réussies, tous organisateurs confondus —
// voir CLAUDE.md > "Refonte du dashboard super-administrateur" > "Section
// Cotisations". Le garde-fou is_admin vit dans app/admin/layout.tsx.
export default async function AdminCotisationsPage({
  searchParams,
}: PageProps<"/admin/cotisations">) {
  const params = await searchParams;
  const qParam = params.q;
  const q = typeof qParam === "string" ? qParam.trim().toLowerCase() : "";

  const admin = createAdminClient();

  const { data: contributions } = await admin
    .from("contributions")
    .select(
      "id, amount_cents, guest_name, guest_email, created_at, gift_items(title, events(name, organizer_id, fee_mode, profiles(display_name)))",
    )
    .eq("status", "succeeded")
    .order("created_at", { ascending: false });

  const organizerIds = Array.from(
    new Set(
      (contributions ?? [])
        .map((c) => c.gift_items?.events?.organizer_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const emailByOrganizerId = new Map<string, string>();
  if (organizerIds.length > 0) {
    const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const authUser of usersData?.users ?? []) {
      if (organizerIds.includes(authUser.id)) {
        emailByOrganizerId.set(authUser.id, authUser.email ?? "—");
      }
    }
  }

  const lignes = (contributions ?? []).map((c) => {
    const feeMode = (c.gift_items?.events?.fee_mode ?? "frais_en_sus") as FeeMode;
    const montantPreleveCents = computeMontantPreleveCents(c.amount_cents, feeMode);
    const commissionCents = computeApplicationFeeAmountCents(montantPreleveCents);
    const organizerId = c.gift_items?.events?.organizer_id ?? null;
    return {
      id: c.id,
      amountCents: c.amount_cents,
      commissionCents,
      guestLabel: c.guest_name?.trim() || "Anonyme",
      guestEmail: c.guest_email ?? "",
      listName: c.gift_items?.events?.name ?? "—",
      giftTitle: c.gift_items?.title ?? "—",
      organizerPseudo: c.gift_items?.events?.profiles?.display_name ?? null,
      organizerEmail: organizerId ? (emailByOrganizerId.get(organizerId) ?? "—") : "—",
      createdAt: c.created_at,
    };
  });

  const lignesFiltrees = q
    ? lignes.filter((ligne) =>
        [ligne.guestLabel, ligne.guestEmail, ligne.organizerPseudo ?? "", ligne.organizerEmail]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : lignes;

  const totalCents = lignesFiltrees.reduce((total, ligne) => total + ligne.amountCents, 0);
  const commissionTotaleCents = lignesFiltrees.reduce(
    (total, ligne) => total + ligne.commissionCents,
    0,
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <h1 className="font-heading mb-2 text-3xl font-bold text-corail">Cotisations</h1>
      <p className="mb-5 text-[15px] text-[#7A6354]">
        {lignesFiltrees.length} cotisation{lignesFiltrees.length > 1 ? "s" : ""} réussie
        {lignesFiltrees.length > 1 ? "s" : ""}
        {q ? ` pour « ${q} »` : ""} · {formatPriceCents(totalCents)} au total · commission Kdovie{" "}
        {formatPriceCents(commissionTotaleCents)}.
      </p>

      <form className="mb-7 flex flex-wrap gap-2.5">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Nom/email de l'organisateur ou de l'invité"
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
            href="/admin/cotisations"
            className="inline-flex items-center px-2 text-sm font-semibold text-[#8A7263] underline"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {lignesFiltrees.length === 0 ? (
        <p className="text-sm text-gris">Aucune cotisation ne correspond.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#F2DFC9] bg-white">
          <table className="w-full min-w-[820px] border-collapse text-[15px]">
            <thead>
              <tr className="border-b-2 border-[#F2DFC9] text-left text-sm text-[#8A7263]">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Cadeau / liste</th>
                <th className="px-4 py-3 font-semibold">Organisateur</th>
                <th className="px-4 py-3 font-semibold">Invité</th>
                <th className="px-4 py-3 text-right font-semibold">Montant</th>
                <th className="px-4 py-3 text-right font-semibold">Commission Kdovie</th>
              </tr>
            </thead>
            <tbody>
              {lignesFiltrees.map((ligne) => (
                <tr key={ligne.id} className="border-b border-[#F2DFC9] last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-[#8A7263]">
                    {new Date(ligne.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-[#4A3529]">
                    <div className="font-semibold">{ligne.giftTitle}</div>
                    <div className="text-sm text-[#8A7263]">{ligne.listName}</div>
                  </td>
                  <td className="px-4 py-3 text-[#4A3529]">
                    {ligne.organizerPseudo ?? ligne.organizerEmail}
                    {ligne.organizerPseudo && (
                      <div className="text-sm text-[#8A7263]">{ligne.organizerEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#4A3529]">
                    {ligne.guestLabel}
                    {ligne.guestEmail && (
                      <div className="text-sm text-[#8A7263]">{ligne.guestEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#4A3529]">
                    {formatPriceCents(ligne.amountCents)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#4A3529]">
                    {formatPriceCents(ligne.commissionCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
