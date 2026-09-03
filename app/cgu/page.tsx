import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";
import PageLegale from "@/components/layout/PageLegale";

export const metadata: Metadata = pageMetadata({
  title: "Conditions générales d'utilisation",
  description:
    "Les conditions générales d'utilisation du service de listes de cadeaux Kdovie, édité par Prowebia.",
  path: "/cgu",
});

export default async function CguPage() {
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
    <PageLegale title="Conditions générales d'utilisation" estConnecte={Boolean(user)} pseudo={pseudo}>
      <p className="text-[15px] text-[#8A7263] italic">Dernière mise à jour : 18 août 2026</p>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">1. Objet</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Les présentes CGU régissent l&apos;accès et l&apos;utilisation du site kdovie.com,
          édité par Prowebia (voir mentions légales), plateforme de listes de cadeaux permettant
          à un organisateur de créer une liste pour un événement personnel et à ses proches
          (invités) de consulter cette liste, réserver un article ou contribuer financièrement à
          son achat.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">2. Accès au service</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Le service s&apos;adresse à deux profils d&apos;utilisateurs :
        </p>
        <ul className="flex list-disc flex-col gap-2 pl-6 text-[16px] leading-relaxed text-[#5C4436]">
          <li>
            l&apos;<strong>organisateur</strong>, qui crée un compte et gère une ou plusieurs
            listes ;
          </li>
          <li>
            l&apos;<strong>invité</strong>, qui consulte une liste via un lien partagé et peut
            réserver ou cotiser sans création de compte obligatoire.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">3. Compte organisateur</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          La création d&apos;un compte organisateur se fait par lien magique envoyé par email
          (authentification sans mot de passe). L&apos;organisateur est responsable de
          l&apos;exactitude des informations fournies et de la confidentialité de l&apos;accès à
          sa messagerie.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          4. Création et gestion de listes
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          L&apos;organisateur peut créer une ou plusieurs listes, y ajouter des articles en
          collant un lien produit (les informations — titre, prix, image — sont récupérées
          automatiquement quand c&apos;est possible, mais restent modifiables et doivent être
          vérifiées par l&apos;organisateur) ou en saisie manuelle. L&apos;organisateur choisit
          la visibilité de sa liste (brouillon ou ouverte aux invités) et peut la supprimer à
          tout moment ; une liste supprimée n&apos;est plus accessible mais ses données ne sont
          pas définitivement effacées (voir politique de confidentialité).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          5. Réservation et cotisation par un invité
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Un invité peut réserver un article directement ou contribuer financièrement à son
          achat, selon le mode défini pour l&apos;article. La réservation est gratuite et ne
          nécessite pas de compte. La cotisation implique un paiement, encadré par les
          Conditions générales de vente (CGV).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          6. Liens vers des sites marchands tiers
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Les articles ajoutés à une liste renvoient vers des sites marchands tiers (Amazon, et
          autres boutiques en ligne) sur lesquels Kdovie n&apos;a aucun contrôle. Kdovie
          n&apos;est pas partie à la vente entre l&apos;invité (ou l&apos;organisateur) et le
          marchand, et ne peut être tenu responsable de la disponibilité, de l&apos;exactitude
          des informations produit, ou de tout litige relatif à cet achat.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">7. Usage interdit</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          L&apos;utilisateur s&apos;engage à ne pas utiliser le service à des fins frauduleuses,
          à ne pas publier de contenu illicite, et à ne pas tenter de contourner les mécanismes
          de sécurité ou de verrouillage du service (notamment ceux encadrant les réservations
          et cotisations).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          8. Disponibilité du service
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Kdovie met en œuvre les moyens raisonnables pour assurer la disponibilité du service,
          sans garantie de continuité absolue. Des interruptions pour maintenance ou en cas de
          force majeure peuvent survenir.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">9. Responsabilité</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Kdovie ne saurait être tenu responsable des dommages indirects résultant de
          l&apos;utilisation du service, ni des conséquences liées à l&apos;indisponibilité
          d&apos;un site marchand tiers ou à l&apos;inexactitude d&apos;informations récupérées
          automatiquement.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">10. Droit applicable</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Les présentes CGU sont soumises au droit français. Tout litige relève, à défaut de
          résolution amiable, de la compétence des tribunaux français.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          11. Modification des CGU
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Kdovie peut modifier les présentes CGU à tout moment ; les utilisateurs sont invités à
          les consulter régulièrement.
        </p>
      </section>
    </PageLegale>
  );
}
