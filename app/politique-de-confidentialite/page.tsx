import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageLegale from "@/components/layout/PageLegale";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Kdovie",
};

export default async function PolitiqueConfidentialitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pseudo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    pseudo = profile?.first_name?.trim() || user.email?.split("@")[0] || null;
  }

  return (
    <PageLegale
      title="Politique de confidentialité"
      estConnecte={Boolean(user)}
      pseudo={pseudo}
    >
      <p className="text-[15px] text-[#8A7263] italic">Dernière mise à jour : 29 août 2026</p>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          1. Qui est responsable de vos données ?
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Prowebia, SASU au capital de 500 €, SIREN 992 497 891, RCS Amiens, siège social 15 Rue
          du Bois 80540 Clairy-Saulchoix, est responsable du traitement des données collectées sur
          kdovie.com. Pour toute question, contactez{" "}
          <a href="mailto:contact@kdovie.com" className="underline hover:text-corail">
            contact@kdovie.com
          </a>
          . Nous n&apos;avons pas désigné de délégué à la protection des données (DPO) — nos
          activités n&apos;entrent pas dans les cas où cette désignation est obligatoire ;
          adressez-nous directement vos questions.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          2. Quelles données collectons-nous, et pourquoi ?
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          <em>Si vous êtes organisateur (vous créez un compte)</em> : votre email (connexion par
          lien magique, sans mot de passe), votre prénom et nom (affichés sur vos listes et, si
          vous l&apos;activez, dans la recherche publique), votre code postal et ville
          (uniquement si vous activez la recherche publique). Base légale : exécution du contrat
          qui nous lie (vous fournir le service Kdovie) pour l&apos;email/prénom/nom, consentement
          explicite pour la recherche publique (case à cocher séparée, désactivée par défaut).
        </p>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          <em>Si vous êtes invité (vous réservez ou cotisez sur une liste, sans compte)</em> :
          votre nom et email, tous deux facultatifs. Base légale : exécution du contrat (vous
          permettre de réserver/cotiser) et, si vous renseignez votre email, notre intérêt légitime
          à vous envoyer une confirmation et à vous permettre d&apos;annuler votre réservation.
        </p>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          <em>Si vous cotisez financièrement</em> : vos coordonnées bancaires sont saisies
          directement sur les pages sécurisées de Stripe, notre prestataire de paiement — nous ne
          les voyons ni ne les stockons jamais. Nous recevons uniquement la confirmation que le
          paiement a réussi et son montant.
        </p>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          <em>Navigation</em> : si vous acceptez notre bandeau de cookies, nous utilisons Google
          Analytics pour mesurer la fréquentation du site (pages consultées, provenance, appareil)
          — jamais pour vous identifier personnellement. Voir la section 5.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          3. Combien de temps conservons-nous vos données ?
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-[16px] leading-relaxed text-[#5C4436]">
          <li>Vos coordonnées d&apos;invité (nom, email) : 12 mois après la date de l&apos;événement concerné.</li>
          <li>
            Votre compte organisateur, si vous ne vous reconnectez plus : 3 ans après votre
            dernière connexion, puis suppression ou anonymisation.
          </li>
          <li>Vos données de navigation (Google Analytics), si vous les avez acceptées : 14 mois.</li>
          <li>
            Les données liées à un paiement réel (montants, dates) peuvent être conservées plus
            longtemps lorsque la loi nous y oblige (obligations comptables et fiscales).
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          4. À qui transmettons-nous vos données ?
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Uniquement aux prestataires qui nous aident à faire fonctionner Kdovie, jamais à des
          tiers à des fins commerciales : Stripe (paiement), Resend (emails), Supabase
          (hébergement de la base de données), Vercel (hébergement du site), ScrapingAnt et Bright
          Data (récupération des informations d&apos;un produit à partir d&apos;un lien que vous
          collez — ils ne reçoivent que ce lien, jamais vos données personnelles), et si vous
          acceptez les cookies, Google (Analytics et Search Console). Certains de ces prestataires
          sont basés aux États-Unis ; leurs transferts de données sont encadrés par les clauses
          contractuelles types de la Commission européenne et/ou une certification au cadre
          européen de protection des données (Data Privacy Framework).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          5. Les cookies utilisés sur Kdovie
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-[16px] leading-relaxed text-[#5C4436]">
          <li>
            Un cookie technique qui garde votre session de connexion active (si vous êtes
            organisateur) — strictement nécessaire, pas de consentement requis.
          </li>
          <li>
            Si vous acceptez notre bandeau, des cookies Google Analytics pour mesurer
            l&apos;audience du site — vous pouvez revenir sur ce choix à tout moment via le lien
            « Gérer les cookies » en pied de page.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">6. Vos droits</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Vous pouvez nous demander d&apos;accéder à vos données, de les rectifier, de les
          effacer, d&apos;en limiter l&apos;usage, ou d&apos;en récupérer une copie, en écrivant à{" "}
          <a href="mailto:contact@kdovie.com" className="underline hover:text-corail">
            contact@kdovie.com
          </a>
          . Nous répondons sous 1 mois. Vous pouvez aussi déposer une réclamation auprès de la
          CNIL (cnil.fr) si vous estimez que vos droits ne sont pas respectés.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">7. Sécurité</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Nous prenons des mesures raisonnables pour protéger vos données (chiffrement des
          connexions, accès restreint à notre base de données, aucun stockage de coordonnées
          bancaires). Aucun système n&apos;est infaillible ; en cas d&apos;incident affectant vos
          données, nous vous en informerons conformément à nos obligations légales.
        </p>
      </section>
    </PageLegale>
  );
}
