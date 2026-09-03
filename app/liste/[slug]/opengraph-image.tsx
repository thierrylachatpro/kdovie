import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

// Aperçu de partage d'une liste (WhatsApp, Messenger, Facebook…) — c'est le
// geste central du produit : coller le lien de sa liste. Les pages restent
// noindex (données perso), seule cette vignette est soignée. Dessin 100 %
// flexbox, pas de police custom (robustesse déploiement).
export const alt = "Une liste de cadeaux sur Kdovie";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let nomListe = "Une liste de cadeaux";
  let prenom: string | null = null;
  try {
    const supabase = await createClient();
    const { data: event } = await supabase
      .from("events")
      .select("name, organizer_id, deleted_at")
      .eq("slug", slug)
      .single();
    if (event && !event.deleted_at) {
      nomListe = event.name;
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", event.organizer_id)
        .single();
      prenom = profile?.first_name?.trim() || null;
    }
  } catch {
    // Vignette générique en repli — jamais d'erreur qui casserait l'aperçu.
  }

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
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              position: "relative",
              width: "52px",
              height: "52px",
              borderRadius: "12px",
              background: "#E8734A",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: 0,
                right: 0,
                height: "12px",
                background: "#F5B942",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "22px",
                width: "8px",
                background: "#FFF8F0",
              }}
            />
          </div>
          <div style={{ fontSize: "36px", fontWeight: 700, color: "#E8734A", letterSpacing: "-1px" }}>
            kdovie
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {prenom && (
            <div style={{ fontSize: "30px", fontWeight: 600, color: "#E8734A" }}>
              La liste de {prenom}
            </div>
          )}
          <div
            style={{
              fontSize: "68px",
              fontWeight: 700,
              color: "#C0512A",
              lineHeight: 1.08,
              maxWidth: "1000px",
            }}
          >
            {nomListe}
          </div>
          <div style={{ fontSize: "28px", color: "#5C4436" }}>
            Réservez un cadeau ou participez à la cagnotte — sans créer de compte.
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
