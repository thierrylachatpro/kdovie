import type { ReactNode } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPriceCents } from "@/lib/gift-item";
import {
  computeApplicationFeeAmountCents,
  computeMontantPreleveCents,
  type FeeMode,
} from "@/lib/fee-calculation";

// Écran de synthèse de /admin — voir CLAUDE.md > "Refonte du dashboard
// super-administrateur". Le garde-fou is_admin est posé une seule fois dans
// app/admin/layout.tsx, plus besoin de le répéter ici. Remplace l'ancien
// contenu de cette page (qui ne montrait que les listes supprimées, déplacé
// vers /admin/listes).
function debutDeJour(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function StatTile({ label, value, sousTexte }: { label: string; value: string; sousTexte?: string }) {
  return (
    <div className="rounded-2xl border-2 border-[#F2DFC9] bg-white p-5">
      <div className="text-sm font-semibold text-[#8A7263]">{label}</div>
      <div className="font-heading mt-1 text-[28px] font-bold text-[#4A3529]">{value}</div>
      {sousTexte && <div className="mt-0.5 text-sm text-[#8A7263]">{sousTexte}</div>}
    </div>
  );
}

function GroupeStats({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-heading mb-3 text-xl font-bold text-corail">{titre}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export default async function AdminPage() {
  const admin = createAdminClient();

  const maintenant = new Date();
  const debutJour = debutDeJour(maintenant).toISOString();
  const il7Jours = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: organisateursTotal },
    { count: organisateursAujourdhui },
    { count: organisateurs7j },
    { count: listesTotal },
    { count: listesOuvertes },
    { count: listesBrouillon },
    { count: listes7j },
    { count: reservationsTotal },
    { count: reservations7j },
    { data: contributionsReussies },
    { data: comptesStripe },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", debutJour),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", il7Jours),
    admin.from("events").select("*", { count: "exact", head: true }).is("deleted_at", null),
    admin
      .from("events")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "ouverte"),
    admin
      .from("events")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "brouillon"),
    admin
      .from("events")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", il7Jours),
    admin.from("reservations").select("*", { count: "exact", head: true }).is("cancelled_at", null),
    admin
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .is("cancelled_at", null)
      .gte("reserved_at", il7Jours),
    admin
      .from("contributions")
      .select("amount_cents, created_at, gift_items(events(fee_mode))")
      .eq("status", "succeeded"),
    admin.from("organizer_stripe_accounts").select("payouts_enabled"),
  ]);

  const contributions = contributionsReussies ?? [];
  const contributions7j = contributions.filter((c) => c.created_at >= il7Jours);

  const sommeCents = (liste: typeof contributions) =>
    liste.reduce((total, c) => total + c.amount_cents, 0);

  const commissionCumuleeCents = (liste: typeof contributions) =>
    liste.reduce((total, c) => {
      const feeMode = (c.gift_items?.events?.fee_mode ?? "frais_en_sus") as FeeMode;
      const montantPreleve = computeMontantPreleveCents(c.amount_cents, feeMode);
      return total + computeApplicationFeeAmountCents(montantPreleve);
    }, 0);

  const accounts = comptesStripe ?? [];
  const stripeActifs = accounts.filter((a) => a.payouts_enabled).length;
  const stripeEnAttente = accounts.filter((a) => !a.payouts_enabled).length;
  const stripeAucun = Math.max((organisateursTotal ?? 0) - accounts.length, 0);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <h1 className="font-heading mb-7 text-3xl font-bold text-corail">Vue d&apos;ensemble</h1>

      <GroupeStats titre="Organisateurs">
        <StatTile label="Total inscrits" value={String(organisateursTotal ?? 0)} />
        <StatTile label="Nouveaux aujourd'hui" value={String(organisateursAujourdhui ?? 0)} />
        <StatTile label="Nouveaux sur 7 jours" value={String(organisateurs7j ?? 0)} />
      </GroupeStats>

      <GroupeStats titre="Listes">
        <StatTile label="Total" value={String(listesTotal ?? 0)} />
        <StatTile label="Ouvertes" value={String(listesOuvertes ?? 0)} />
        <StatTile label="Brouillon" value={String(listesBrouillon ?? 0)} />
        <StatTile label="Nouvelles sur 7 jours" value={String(listes7j ?? 0)} />
      </GroupeStats>

      <GroupeStats titre="Réservations">
        <StatTile label="Total" value={String(reservationsTotal ?? 0)} />
        <StatTile label="Sur 7 jours" value={String(reservations7j ?? 0)} />
      </GroupeStats>

      <GroupeStats titre="Cotisations">
        <StatTile label="Total réussies" value={String(contributions.length)} />
        <StatTile label="Sur 7 jours" value={String(contributions7j.length)} />
        <StatTile
          label="Montant total cotisé"
          value={formatPriceCents(sommeCents(contributions))}
          sousTexte={`${formatPriceCents(sommeCents(contributions7j))} sur 7 jours`}
        />
        <StatTile
          label="Commission Kdovie cumulée"
          value={formatPriceCents(commissionCumuleeCents(contributions))}
          sousTexte={`${formatPriceCents(commissionCumuleeCents(contributions7j))} sur 7 jours`}
        />
      </GroupeStats>

      <GroupeStats titre="Comptes Stripe organisateurs">
        <StatTile label="Actifs" value={String(stripeActifs)} />
        <StatTile label="En attente" value={String(stripeEnAttente)} />
        <StatTile label="Aucun compte" value={String(stripeAucun)} />
      </GroupeStats>
    </div>
  );
}
