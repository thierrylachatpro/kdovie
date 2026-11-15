import { ImageResponse } from "next/og";
import { storyMessage, storyTheme } from "@/lib/story-message";
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

  // Taille du lien adaptée à sa longueur pour qu'il tienne sur une ligne
  // dans le bandeau (≈ 0,56 em par caractère en police par défaut).
  const tailleLien = Math.max(24, Math.min(60, Math.floor(800 / (urlAffichee.length * 0.56))));
  const theme = storyTheme(liste.type);

  // Confettis aux couleurs de la marque, placés dans les marges pour ne
  // jamais gêner la lecture.
  const confettis: { x: number; y: number; t: number; c: string; r: number; rond?: boolean }[] = [
    { x: 70, y: 250, t: 26, c: "#F5B942", r: 20 },
    { x: 960, y: 300, t: 34, c: "#E8734A", r: 0, rond: true },
    { x: 140, y: 560, t: 18, c: "#8BA888", r: 0, rond: true },
    { x: 905, y: 640, t: 24, c: "#F5B942", r: -25 },
    { x: 60, y: 980, t: 30, c: "#E8734A", r: 35 },
    { x: 985, y: 1060, t: 20, c: "#8BA888", r: 15 },
    { x: 110, y: 1350, t: 22, c: "#F5B942", r: 0, rond: true },
    { x: 950, y: 1420, t: 28, c: "#E8734A", r: -15 },
    { x: 190, y: 1700, t: 16, c: "#8BA888", r: 30 },
    { x: 880, y: 1760, t: 22, c: "#F5B942", r: 0, rond: true },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundImage: `linear-gradient(180deg, ${theme.fondHaut} 0%, ${theme.fondHaut} 35%, ${theme.fondBas} 100%)`,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {confettis.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${c.x}px`,
              top: `${c.y}px`,
              width: `${c.t}px`,
              height: c.rond ? `${c.t}px` : `${Math.round(c.t * 0.45)}px`,
              borderRadius: c.rond ? "999px" : "6px",
              background: c.c,
              transform: `rotate(${c.r}deg)`,
              opacity: 0.85,
            }}
          />
        ))}

        {/* Bandeau aux couleurs de la marque, comme en haut du site */}
        <div style={{ display: "flex", width: "100%", height: "28px" }}>
          <div style={{ flex: 3, background: "#E8734A" }} />
          <div style={{ flex: 2, background: "#F5B942" }} />
          <div style={{ flex: 1, background: "#8BA888" }} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-around",
            width: "100%",
            flex: 1,
            padding: "200px 90px 250px",
          }}
        >
          {/* Logo canonique */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <svg width="190" height="190" viewBox="0 0 56 56" fill="none">
              <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
              <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
              <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
              <path d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z" fill="#8BA888" />
              <path d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z" fill="#8BA888" />
            </svg>
            <div style={{ fontSize: "112px", fontWeight: 700, color: "#E8734A", letterSpacing: "-4px", lineHeight: 1 }}>
              kdovie
            </div>
            <div style={{ fontSize: "32px", color: "#8A7263" }}>
              Un seul compte, toute une vie de cadeaux
            </div>
          </div>

          {/* Thème + phrase */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "28px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "190px",
                height: "190px",
                borderRadius: "999px",
                background: "#FFFFFF",
                fontSize: "110px",
                boxShadow: "0 10px 30px rgba(74, 53, 41, 0.10)",
              }}
            >
              {theme.emoji}
            </div>
            <div
              style={{
                fontSize: "68px",
                color: "#4A3529",
                lineHeight: 1.18,
                textAlign: "center",
              }}
            >
              {storyMessage(liste.type)}
            </div>
          </div>

          {/* Lien court, bien visible */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              padding: "40px 36px",
              borderRadius: "48px",
              background: "#E8734A",
              color: "#FFF8F0",
              fontSize: `${tailleLien}px`,
              boxShadow: "0 12px 30px rgba(192, 81, 42, 0.25)",
            }}
          >
            {urlAffichee}
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
