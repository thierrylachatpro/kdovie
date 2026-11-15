import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

// Lien court kdovie.com/kdo/{alias} — voir CLAUDE.md > "Liens courts
// mémorisables". Simple porte d'entrée : redirige (308) vers la page publique
// /liste/[slug], qui gère déjà brouillon, liste supprimée, etc. Sans risque de
// cache : la correspondance alias → slug ne change jamais (alias verrouillé
// une fois partagé, slug immuable). Appel REST en clé anon, sans cookies(),
// comme opengraph-image.
export const metadata: Metadata = { robots: { index: false, follow: false } };

async function slugPourAlias(alias: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(
      `${url}/rest/v1/events?select=slug,deleted_at&short_alias=eq.${encodeURIComponent(alias)}`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { slug: string; deleted_at: string | null }[];
    const event = rows[0];
    if (!event || event.deleted_at) return null;
    return event.slug;
  } catch {
    return null;
  }
}

export default async function LienCourtPage({ params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params;
  const slug = await slugPourAlias(decodeURIComponent(alias).trim().toLowerCase());
  if (!slug) notFound();
  permanentRedirect(`/liste/${slug}`);
}
