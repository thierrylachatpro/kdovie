import { ImageResponse } from "next/og";
import { DEFAULT_TITLE } from "@/lib/seo";

// Image Open Graph / Twitter de l'accueil et, par héritage, de toute page
// sans image dédiée. Dessin 100 % flexbox (contrainte Satori) — pas de police
// custom pour rester robuste au déploiement, la typo par défaut couvre les
// accents français. Voir CLAUDE.md > "Audit SEO".
export const alt = DEFAULT_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#FFF8F0",
          padding: "72px",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              width: "68px",
              height: "68px",
              borderRadius: "16px",
              background: "#E8734A",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "19px",
                left: 0,
                right: 0,
                height: "15px",
                background: "#F5B942",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "29px",
                width: "10px",
                background: "#FFF8F0",
              }}
            />
          </div>
          <div style={{ fontSize: "46px", fontWeight: 700, color: "#E8734A", letterSpacing: "-1px" }}>
            kdovie
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div
            style={{
              fontSize: "66px",
              fontWeight: 700,
              color: "#C0512A",
              lineHeight: 1.08,
              maxWidth: "920px",
            }}
          >
            Vos listes de cadeaux, pour chaque occasion de la vie
          </div>
          <div style={{ fontSize: "30px", color: "#5C4436", maxWidth: "880px" }}>
            Anniversaire, mariage, naissance, Noël — réservation ou cagnotte commune,
            sans compte pour vos proches.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ width: "130px", height: "10px", borderRadius: "6px", background: "#E8734A" }} />
          <div style={{ width: "84px", height: "10px", borderRadius: "6px", background: "#F5B942" }} />
          <div style={{ width: "42px", height: "10px", borderRadius: "6px", background: "#8BA888" }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
