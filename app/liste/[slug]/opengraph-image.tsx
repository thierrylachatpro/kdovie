import { ImageResponse } from "next/og";

// Aperçu de partage d'une liste (WhatsApp, Messenger, Facebook…) — c'est le
// geste central du produit : coller le lien de sa liste. Les pages restent
// noindex (données perso), seule cette vignette est soignée. Dessin 100 %
// flexbox, pas de police custom (robustesse déploiement).
//
// Volontairement AUCUNE dépendance à @/lib/supabase/server (donc pas de
// cookies() / client SSR) : le robot d'aperçu est anonyme, et cookies() dans
// le contexte d'une route opengraph-image s'est révélé fragile en prod
// (Facebook recevait une page d'erreur au lieu d'une image). On tape le REST
// Supabase directement avec la clé anon.
export const runtime = "nodejs";
export const alt = "Une liste de cadeaux sur Kdovie";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function chargerInfosListe(
  slug: string,
): Promise<{ nomListe: string; prenom: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const repli = { nomListe: "Une liste de cadeaux", prenom: null as string | null };
  if (!url || !key) return repli;

  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  // Timeout court : mieux vaut une vignette générique qu'une route qui traîne
  // et fait échouer l'aperçu côté Facebook/WhatsApp.
  const signal = AbortSignal.timeout(3500);

  try {
    const [evtRes, prenomRes] = await Promise.all([
      fetch(
        `${url}/rest/v1/events?select=name,deleted_at&slug=eq.${encodeURIComponent(slug)}`,
        { headers, cache: "no-store", signal },
      ),
      fetch(`${url}/rest/v1/rpc/get_list_organizer_first_name`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ p_slug: slug }),
        cache: "no-store",
        signal,
      }),
    ]);

    let nomListe = repli.nomListe;
    if (evtRes.ok) {
      const rows = (await evtRes.json()) as { name: string; deleted_at: string | null }[];
      const event = rows[0];
      if (event && !event.deleted_at && event.name) nomListe = event.name;
      else return repli; // liste inexistante ou supprimée → vignette générique
    }

    let prenom: string | null = null;
    if (prenomRes.ok) {
      const data = await prenomRes.json();
      prenom = typeof data === "string" ? data.trim() || null : null;
    }

    return { nomListe, prenom };
  } catch {
    return repli;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { nomListe, prenom } = await chargerInfosListe(slug);

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
          {prenom ? (
            <div style={{ fontSize: "30px", fontWeight: 600, color: "#E8734A" }}>
              {`La liste de ${prenom}`}
            </div>
          ) : null}
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
