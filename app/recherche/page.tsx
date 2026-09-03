import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import { pageMetadata } from "@/lib/seo";
import PageLegale from "@/components/layout/PageLegale";
import RechercheVille from "@/components/ui/RechercheVille";

export async function generateMetadata({
  searchParams,
}: PageProps<"/recherche">): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const city = typeof params.city === "string" ? params.city.trim() : "";
  // Les pages de résultats (?q=…&city=…) sont noindex : variations infinies +
  // elles révèlent qui est "trouvable". La page nue reste indexable.
  return pageMetadata({
    title: "Retrouver la liste de cadeaux d'un proche",
    description:
      "Cherchez le prénom ou le nom d'un proche et sa ville pour retrouver ses listes de cadeaux ouvertes sur Kdovie.",
    path: "/recherche",
    noindex: Boolean(q && city),
  });
}

// Recherche publique d'organisateurs par nom et ville — voir CLAUDE.md >
// "Recherche publique d'organisateurs par nom et ville". Formulaire GET
// natif (pas de JS de soumission), même principe que /admin/listes et
// /admin/cotisations : URL partageable, résultats rendus côté serveur.
// Le prénom-ou-nom ET la ville sont exigés ensemble, jamais l'un sans
// l'autre, pour ne pas devenir un annuaire consultable en vrac.
export default async function RecherchePage({ searchParams }: PageProps<"/recherche">) {
  const params = await searchParams;
  const qParam = params.q;
  const cityParam = params.city;
  const postalCodeParam = params.postal_code;

  const q = typeof qParam === "string" ? qParam.trim() : "";
  const city = typeof cityParam === "string" ? cityParam.trim() : "";
  const postalCode = typeof postalCodeParam === "string" ? postalCodeParam.trim() : "";

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

  const rechercheLancee = Boolean(q && city);

  const { data: resultats } = rechercheLancee
    ? await supabase.rpc("search_organizers", { p_query: q, p_city: city })
    : { data: null };

  return (
    <PageLegale title="Retrouver une liste" estConnecte={Boolean(user)} pseudo={pseudo}>
      <p className="text-[17px] leading-relaxed text-[#7A6354]">
        Cherchez le prénom ou le nom d&apos;un proche, avec sa ville, pour retrouver ses listes
        ouvertes — seuls les organisateurs qui ont activé la recherche publique apparaissent ici.
      </p>

      <form method="get" className="flex flex-col gap-4 rounded-[28px] border-2 border-[#F2DFC9] bg-white p-6.5">
        <label className="flex flex-col gap-1.5">
          <span className="font-heading text-base font-bold text-[#4A3529]">Prénom ou nom</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Thierry"
            required
            className="w-full rounded-[18px] border-2 border-[#F2DFC9] bg-creme px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
          />
        </label>

        <RechercheVille initialPostalCode={postalCode} initialCity={city} required />

        <button
          type="submit"
          className="font-heading inline-flex w-fit items-center justify-center rounded-2xl bg-corail px-6.5 py-4 text-base font-bold text-creme hover:bg-[#D45F37]"
        >
          Chercher
        </button>
      </form>

      {rechercheLancee && (
        <div className="flex flex-col gap-3">
          {(resultats ?? []).length === 0 ? (
            <p className="text-[15px] text-[#8A7263]">
              Aucune liste trouvée pour « {q} » à {city}.
            </p>
          ) : (
            (resultats ?? []).map((resultat) => (
              <Link
                key={resultat.event_id}
                href={`/liste/${resultat.event_slug}`}
                className="flex items-center gap-4 rounded-2xl border-2 border-[#F2DFC9] bg-white p-5 hover:border-corail"
              >
                <span className="flex h-13 w-13 flex-none items-center justify-center rounded-2xl bg-[#F7E7D6] text-2xl">
                  {eventTypeIcon(resultat.event_type)}
                </span>
                <div className="min-w-0">
                  <div className="font-heading truncate text-lg font-bold text-[#4A3529]">
                    {resultat.event_name}
                  </div>
                  <div className="text-sm text-[#8A7263]">
                    {[resultat.first_name, resultat.last_name].filter(Boolean).join(" ")}
                    {resultat.event_type && ` · ${eventTypeLabel(resultat.event_type)}`}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </PageLegale>
  );
}
