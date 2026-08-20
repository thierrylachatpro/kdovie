import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageLegale from "@/components/layout/PageLegale";

export const metadata: Metadata = {
  title: "Mentions légales | Kdovie",
};

export default async function MentionsLegalesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pseudo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    pseudo = profile?.display_name?.trim() || null;
  }

  return (
    <PageLegale title="Mentions légales" estConnecte={Boolean(user)} pseudo={pseudo}>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">Éditeur du site</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Le site kdovie.com est édité par <strong>Prowebia</strong>, société par actions
          simplifiée unipersonnelle (SASU) au capital de 500 €, immatriculée au Registre du
          Commerce et des Sociétés d&apos;Amiens sous le numéro SIREN 992 497 891, dont le siège
          social est situé 15 Rue du Bois, 80540 Clairy-Saulchoix, France.
        </p>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Numéro de TVA intracommunautaire : FR18992497891
        </p>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Directeur de la publication : Thierry Lachat, Président
        </p>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Contact :{" "}
          <a href="mailto:contact@kdovie.com" className="text-corail underline">
            contact@kdovie.com
          </a>
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">Hébergement</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
          États-Unis.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">Propriété intellectuelle</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          L&apos;ensemble des éléments constituant le site kdovie.com (textes, graphismes, logo,
          logiciels) est la propriété exclusive de Prowebia ou de ses partenaires, sauf mention
          contraire, et est protégé par le droit de la propriété intellectuelle. Toute
          reproduction, représentation, modification ou exploitation, totale ou partielle, sans
          autorisation préalable est interdite.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          Programme Amazon Partenaires
        </h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          En tant que Partenaire Amazon, Kdovie réalise un bénéfice sur les achats remplissant
          les conditions requises. Kdovie participe au programme Amazon Partenaires, un
          programme d&apos;affiliation publicitaire conçu pour permettre à des sites de percevoir
          une rémunération grâce à la création de liens vers Amazon.fr.
        </p>
      </section>

      <section id="donnees-personnelles" className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">Données personnelles</h2>
        <p className="text-[16px] leading-relaxed text-[#5C4436]">
          Kdovie traite des données personnelles (organisateurs et invités) dans le cadre de son
          activité.
        </p>
        <p className="text-[15px] leading-relaxed text-[#8A7263] italic">
          Une politique de confidentialité dédiée, détaillant ce traitement, est en cours de
          rédaction et sera liée depuis cette section dès sa publication.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-2xl font-bold text-[#4A3529]">
          Médiation de la consommation
        </h2>
        <p className="text-[15px] leading-relaxed text-[#8A7263] italic">
          Les coordonnées d&apos;un médiateur de la consommation seront ajoutées ici dès la
          souscription à ce service, obligatoire pour toute vente à distance à des consommateurs
          en France.
        </p>
      </section>
    </PageLegale>
  );
}
