import { ImageResponse } from "next/og";
import { storyMessage } from "@/lib/story-message";
import { SITE_URL } from "@/lib/site-url";

// Visuel « story » (1080×1920) qu'un organisateur partage sur Instagram /
// TikTok, voir CLAUDE.md > "Partage d'une liste en story". Même technique
// que opengraph-image.tsx : flexbox pur, pas de police custom, REST Supabase
// en clé anon (pas de cookies()). Pas de QR code : la personne qui regarde la
// story est déjà sur son téléphone.
export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1920;

type InfosListe = { name: string; type: string | null; shortAlias: string | null };

async function chargerListe(slug: string): Promise<InfosListe | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const signal = AbortSignal.timeout(5000);

  const evtRes = await fetch(
    `${url}/rest/v1/events?select=name,type,status,deleted_at,short_alias&slug=eq.${encodeURIComponent(slug)}`,
    { headers, cache: "no-store", signal },
  );

  if (!evtRes.ok) return null;
  const rows = (await evtRes.json()) as {
    name: string;
    type: string | null;
    status: string;
    deleted_at: string | null;
    short_alias: string | null;
  }[];
  const event = rows[0];
  // Inconnue, supprimée ou encore en brouillon : rien à partager.
  if (!event || event.deleted_at || event.status !== "ouverte") return null;

  return { name: event.name, type: event.type, shortAlias: event.short_alias };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let liste: InfosListe | null = null;
  try {
    liste = await chargerListe(slug);
  } catch {
    liste = null;
  }
  if (!liste) {
    return new Response("Liste introuvable", { status: 404 });
  }

  const host = new URL(SITE_URL).host;
  const urlAffichee = liste.shortAlias
    ? `${host}/kdo/${liste.shortAlias}`
    : `${host}/liste/${slug}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          background: "#FFF8F0",
          padding: "250px 90px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo canonique */}
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <svg width="96" height="96" viewBox="0 0 56 56" fill="none">
            <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
            <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
            <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
            <path d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z" fill="#8BA888" />
            <path d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z" fill="#8BA888" />
          </svg>
          <div style={{ fontSize: "72px", fontWeight: 700, color: "#E8734A", letterSpacing: "-2px" }}>
            kdovie
          </div>
        </div>

        {/* Phrase + nom de la liste */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "110px",
            gap: "40px",
          }}
        >
          <div
            style={{
              fontSize: "76px",
              fontWeight: 700,
              color: "#4A3529",
              lineHeight: 1.15,
              textAlign: "center",
            }}
          >
            {storyMessage(liste.type)}
          </div>
          <div
            style={{
              fontSize: "44px",
              fontWeight: 600,
              color: "#C0512A",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {liste.name}
          </div>
        </div>

        {/* Zone réservée au sticker Lien */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "auto",
            width: "100%",
          }}
        >
          <div style={{ fontSize: "44px", fontWeight: 700, color: "#E8734A" }}>
            Touche le lien juste ici
          </div>
          <svg width="90" height="110" viewBox="0 0 90 110" fill="none" style={{ marginTop: "18px" }}>
            <path d="M45 8 V88" stroke="#E8734A" strokeWidth="12" strokeLinecap="round" />
            <path
              d="M14 62 L45 96 L76 62"
              stroke="#E8734A"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              display: "flex",
              marginTop: "24px",
              width: "760px",
              height: "190px",
              borderRadius: "48px",
              border: "6px dashed #E8734A",
              background: "#FFFFFF",
            }}
          />
          <div style={{ marginTop: "40px", fontSize: "34px", color: "#5C4436" }}>{urlAffichee}</div>
          <div style={{ marginTop: "14px", fontSize: "28px", color: "#8BA888", fontWeight: 600 }}>
            sur kdovie.com
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Content-Disposition": `inline; filename="kdovie-story-${slug}.png"`,
        "Cache-Control": "no-store",
      },
    },
  );
}
