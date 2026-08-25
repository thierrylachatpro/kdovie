import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import DeconnexionButton from "@/components/auth/DeconnexionButton";
import IdentiteCard from "@/components/compte/IdentiteCard";
import StripeStatusCard from "@/components/compte/StripeStatusCard";
import LiensLegaux from "@/components/layout/LiensLegaux";
import NavConnecte from "@/components/layout/NavConnecte";
import {
  deriveOrganizerStripeStatus,
  type OrganizerStripeStatus,
} from "@/lib/organizer-stripe-status";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, postal_code, city, searchable, created_at")
    .eq("id", user.id)
    .single();

  const { data: stripeAccount } = await supabase
    .from("organizer_stripe_accounts")
    .select("stripe_account_id, payouts_enabled")
    .eq("organizer_id", user.id)
    .maybeSingle();

  let stripeStatus: OrganizerStripeStatus = "aucun";
  if (stripeAccount) {
    let payoutsEnabled = stripeAccount.payouts_enabled;
    // L'onboarding Stripe se termine hors de l'app (formulaire hébergé) —
    // on rafraîchit le statut réel au chargement tant qu'il n'est pas actif,
    // pas de webhook dédié au compte Connect pour l'instant.
    if (!payoutsEnabled) {
      try {
        const account = await stripe.accounts.retrieve(stripeAccount.stripe_account_id);
        payoutsEnabled = account.payouts_enabled;
        if (payoutsEnabled !== stripeAccount.payouts_enabled) {
          const admin = createAdminClient();
          await admin
            .from("organizer_stripe_accounts")
            .update({ payouts_enabled: payoutsEnabled })
            .eq("organizer_id", user.id);
        }
      } catch {
        // Le compte référencé en base peut être devenu inaccessible
        // (supprimé côté Stripe, accès révoqué...) — ne jamais planter toute
        // la page pour ça, rester sur "en attente" plutôt. Relancer
        // l'onboarding depuis ce statut détecte ce cas et repart à zéro,
        // voir startStripeOnboarding.
      }
    }
    stripeStatus = deriveOrganizerStripeStatus({ payouts_enabled: payoutsEnabled });
  }

  const dateCreation = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : null;

  const fallbackDisplayName = user.email?.split("@")[0] ?? "";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-[1] bg-sauge" />
      </div>

      <header className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-5 px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <svg
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="block h-[38px] w-[38px]"
          >
            <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
            <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
            <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
            <path
              d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z"
              fill="#8BA888"
            />
            <path
              d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z"
              fill="#8BA888"
            />
          </svg>
          <span className="flex flex-col leading-tight">
            <span className="font-heading text-2xl font-bold tracking-tight text-corail">
              kdovie
            </span>
            <span className="text-[13px] text-[#8A7263]">Un seul compte, toute une vie de cadeaux</span>
          </span>
        </Link>
        <NavConnecte
          estConnecte={true}
          pseudo={profile?.first_name?.trim() || user.email?.split("@")[0] || null}
        />
      </header>

      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-6 pt-4 pb-20 sm:px-10">
        <h1 className="font-heading text-[40px] leading-[1.1] font-bold text-corail">
          Mon compte
        </h1>
        <p className="mt-2.5 mb-8 text-lg text-[#7A6354]">
          Votre prénom est le nom que vos proches voient sur vos listes.
        </p>

        <IdentiteCard
          email={user.email ?? ""}
          initialFirstName={profile?.first_name ?? ""}
          initialLastName={profile?.last_name ?? ""}
          initialPostalCode={profile?.postal_code ?? ""}
          initialCity={profile?.city ?? ""}
          initialSearchable={profile?.searchable ?? false}
          fallbackDisplayName={fallbackDisplayName}
          dateCreation={dateCreation}
        />

        <StripeStatusCard status={stripeStatus} />

        <section className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-[#F7E7D6] p-6.5">
          <div>
            <div className="font-heading mb-1 text-lg font-bold text-[#4A3529]">
              Se déconnecter
            </div>
            <p className="text-[15px] text-[#7A6354]">
              Vos listes restent en ligne. Un nouveau lien par e-mail suffit pour revenir.
            </p>
          </div>
          <DeconnexionButton className="font-heading rounded-2xl bg-corail px-6 py-3.5 text-[16px] font-bold text-creme hover:bg-[#D45F37]" />
        </section>
      </main>

      <footer className="bg-[#F7E7D6] px-6 py-6.5 sm:px-10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-6 text-sm text-[#8A7263]">
          <span>© 2026 kdovie</span>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/aide" className="hover:text-corail">
              Aide
            </Link>
            <Link href="/contact" className="hover:text-corail">
              Contact
            </Link>
            <LiensLegaux className="hover:text-corail" />
            <Link href="/recherche" className="hover:text-corail">
              Retrouver une liste
            </Link>
            <Link href="/compte" className="hover:text-corail">
              Mes listes
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
