import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";
import PageLegale from "@/components/layout/PageLegale";

export const metadata: Metadata = pageMetadata({
  title: "Conditions générales de vente",
  description:
    "Les conditions générales de vente applicables aux cagnottes et contributions financières sur Kdovie.",
  path: "/cgv",
});

export default async function CgvPage() {
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
    <PageLegale title="Conditions générales de vente" estConnecte={Boolean(user)} pseudo={pseudo}>
      <p className="text-[15px] text-[#8A7263] italic">Dernière mise à jour : 6 septembre 2026</p>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">1. Objet et champ d&apos;application</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Les présentes conditions générales de vente (CGV) s&apos;appliquent à toute contribution
          financière (ci-après «&nbsp;cotisation&nbsp;») réalisée par un invité sur une liste de
          cadeaux hébergée sur kdovie.com, éditée par Prowebia, SASU au capital de 500 €, SIREN
          992 497 891, RCS Amiens, siège social 15 Rue du Bois 80540 Clairy-Saulchoix (ci-après
          «&nbsp;Kdovie&nbsp;»). Elles complètent les{" "}
          <Link href="/cgu" className="text-corail underline">
            conditions générales d&apos;utilisation
          </Link>
          . Le fait de valider une cotisation emporte acceptation pleine et entière des présentes
          CGV.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">2. Nature du service</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Kdovie met à disposition un outil permettant à un organisateur de constituer une cagnotte
          en vue de l&apos;achat d&apos;un cadeau, et à ses invités d&apos;y contribuer. La
          cotisation est un versement au bénéfice de l&apos;organisateur de la liste&nbsp;: les
          fonds sont transférés directement à ce dernier via notre prestataire de paiement, sans
          jamais être encaissés sur un compte intermédiaire de Kdovie. Kdovie n&apos;est pas le
          vendeur du cadeau et n&apos;est pas partie à l&apos;éventuel achat effectué ensuite par
          l&apos;organisateur auprès d&apos;un marchand tiers.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">3. Prix, frais et commission</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          L&apos;invité choisit librement le montant de sa cotisation (minimum 1 €). À ce montant
          s&apos;ajoutent les frais de traitement bancaire de notre prestataire de paiement et une
          commission de Kdovie de 1 %. Selon le réglage choisi par l&apos;organisateur pour sa
          liste&nbsp;:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-[16px] leading-relaxed text-[#5C4436]">
          <li>
            soit ces frais sont ajoutés au montant que vous cotisez (l&apos;organisateur reçoit
            alors exactement la somme que vous avez choisie)&nbsp;;
          </li>
          <li>
            soit ils sont déduits de votre cotisation (l&apos;organisateur reçoit la somme
            choisie diminuée des frais et de la commission).
          </li>
        </ul>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Le détail complet (montant du cadeau, frais bancaires, commission Kdovie, total prélevé
          sur votre carte) vous est présenté à l&apos;écran avant tout paiement. Aucun frais
          caché n&apos;est appliqué.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">4. Paiement</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Le paiement s&apos;effectue par carte bancaire, sur les pages sécurisées de notre
          prestataire de paiement Stripe. Vos coordonnées bancaires sont saisies directement chez
          Stripe et ne sont jamais transmises à Kdovie ni stockées par Kdovie. La cotisation est
          confirmée dès la validation du paiement par Stripe.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          5. Exécution immédiate de la cotisation
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          La cotisation constitue une prestation dont l&apos;exécution est immédiate&nbsp;: dès la
          confirmation de votre paiement, les fonds correspondants sont transférés à
          l&apos;organisateur de la liste (le transfert effectif peut être temporairement différé
          si la vérification d&apos;identité de l&apos;organisateur par Stripe n&apos;est pas
          achevée, mais la cotisation, elle, est acquise). Au moment de valider votre cotisation,
          vous demandez expressément que cette exécution commence immédiatement, sans attendre
          l&apos;expiration du délai de rétractation.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">6. Droit de rétractation</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          En application de l&apos;article L221-28 du Code de la consommation, le droit de
          rétractation de 14 jours ne peut pas être exercé pour une prestation de service
          pleinement exécutée avant la fin de ce délai lorsque trois conditions sont réunies. Sur
          Kdovie, ces trois conditions sont réunies au moment où vous cotisez&nbsp;:
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-[16px] leading-relaxed text-[#5C4436]">
          <li>
            <strong>Accord exprès à l&apos;exécution immédiate</strong>&nbsp;: en validant votre
            cotisation, vous demandez expressément que celle-ci soit exécutée immédiatement, sans
            attendre la fin du délai de rétractation.
          </li>
          <li>
            <strong>Renonciation expresse au droit de rétractation</strong>&nbsp;: vous
            reconnaissez expressément qu&apos;en validant votre cotisation, vous renoncez à votre
            droit de rétractation de 14 jours applicable aux achats à distance. Cette
            renonciation est recueillie au moyen d&apos;une case à cocher, non pré-cochée, que
            vous validez avant le paiement.
          </li>
          <li>
            <strong>Information préalable</strong>&nbsp;: vous êtes informé, par les présentes CGV
            et par le texte affiché au moment de la cotisation, de la perte de votre droit de
            rétractation une fois la prestation pleinement exécutée.
          </li>
        </ul>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          En conséquence, une fois votre cotisation validée et le paiement confirmé, vous ne
          disposez plus d&apos;un droit de rétractation.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          7. Absence de remboursement
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Compte tenu de l&apos;exécution immédiate décrite ci-dessus, une cotisation validée
          n&apos;est pas remboursable. Il n&apos;existe pas de plafond de cagnotte&nbsp;: si les
          cotisations cumulées dépassent le prix affiché du cadeau, le surplus reste acquis à
          l&apos;organisateur et n&apos;est pas remboursé. Nous vous invitons à vérifier le
          montant et le destinataire de votre cotisation avant de la valider. En cas de paiement
          manifestement erroné ou frauduleux, contactez-nous à{" "}
          <a href="mailto:contact@kdovie.com" className="text-corail underline">
            contact@kdovie.com
          </a>{" "}
          : nous examinerons la situation au cas par cas, sans que cela constitue une garantie de
          remboursement.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          8. Réclamations et médiation de la consommation
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Toute réclamation relative à une cotisation doit être adressée à{" "}
          <a href="mailto:contact@kdovie.com" className="text-corail underline">
            contact@kdovie.com
          </a>
          . Nous nous efforçons d&apos;y répondre dans les meilleurs délais.
        </p>
        <p className="text-[15px] leading-relaxed text-[#8A7263] italic">
          Kdovie procède actuellement à la désignation d&apos;un médiateur de la consommation
          conformément à l&apos;article L.616-1 du Code de la consommation ; ses coordonnées
          seront ajoutées ici dès finalisation de cette démarche.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">9. Données personnelles</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Le traitement des données collectées à l&apos;occasion d&apos;une cotisation est décrit
          dans notre{" "}
          <Link href="/politique-de-confidentialite" className="text-corail underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">10. Droit applicable</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Les présentes CGV sont soumises au droit français. À défaut de résolution amiable, tout
          litige relève de la compétence des tribunaux français.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">11. Modification des CGV</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Kdovie peut modifier les présentes CGV à tout moment. Les CGV applicables sont celles en
          vigueur à la date de votre cotisation.
        </p>
      </section>
    </PageLegale>
  );
}
