import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageLegale from "@/components/layout/PageLegale";

export const metadata: Metadata = {
  title: "Conditions générales de vente | Kdovie",
};

export default async function CgvPage() {
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
    <PageLegale title="Conditions générales de vente" estConnecte={Boolean(user)} pseudo={pseudo}>
      <p className="font-heading text-lg font-bold text-[#4A3529]">
        Cette page est en cours de rédaction.
      </p>
      <p className="text-[16px] leading-relaxed text-[#5C4436]">
        Les conditions générales de vente encadrant les cotisations réalisées sur Kdovie
        (paiement, remboursement, droit de rétractation, médiation de la consommation) seront
        publiées prochainement, une fois le cadrage juridique finalisé.
      </p>
      <p className="text-[16px] leading-relaxed text-[#5C4436]">
        Pour toute question en attendant, contactez-nous à{" "}
        <a href="mailto:contact@kdovie.com" className="text-corail underline">
          contact@kdovie.com
        </a>
        .
      </p>
    </PageLegale>
  );
}
