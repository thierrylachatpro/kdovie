import type { ScrapedArticle } from "@/lib/scrape-article";

// Amazon Scraper API de Bright Data (Datasets API, dataset structuré dédié
// amazon.fr) — voir CLAUDE.md > "Intégration Bright Data pour la fiche
// produit Amazon". Filet de secours existant (ScrapingAnt + cheerio, repli
// Amazon dans parseArticleMetadata) conservé tel quel : cette fonction ne
// fait qu'ajouter une première tentative pour amazon.fr, jamais de retrait
// du filet.
//
// Mapping des champs confirmé par un appel réel le 24 août 2026 (5 URLs
// amazon.fr réelles et variées, voir CLAUDE.md > "Intégration Bright Data
// pour la fiche produit Amazon" > statut) — corrige la doc publique
// consultée en amont, qui annonçait à tort `price`/`main_image` :
// - Pas de champ `price` : `final_price` (prix affiché actuellement, déjà
//   remisé le cas échéant) et `initial_price` (prix barré) coexistent,
//   identiques quand il n'y a pas de remise. `final_price` est le bon champ
//   à utiliser. Les deux sont absents (pas juste `null`) quand l'article
//   est indisponible — aucun prix à afficher dans ce cas, comportement
//   déjà correct côté parsePriceCents (valeur non finite -> null).
// - Pas de champ `main_image` : `image`/`image_url` (identiques dans tous
//   les cas observés) et `images` (tableau) sont les vrais noms.
const BRIGHTDATA_API_KEY = process.env.BRIGHTDATA_API_KEY;
const DATASET_ID = "gd_l7q7dkf244hwjntr0";
// Timeout Bright Data lui-même à 1 minute avant de basculer en asynchrone
// (HTTP 202 + snapshot_id, non géré ici, voir plus bas) — délai fetch un
// peu en dessous pour laisser le temps à une réponse synchrone normale
// (10-30s annoncés) sans risquer de dépasser la limite de la fonction Vercel.
const TIMEOUT_MS = 40000;

function parsePriceCents(price: unknown, currency: unknown): number | null {
  // Devise vérifiée avant tout : mieux vaut un prix vide qu'un prix dans la
  // mauvaise devise stocké par erreur.
  if (typeof currency !== "string" || currency.toUpperCase() !== "EUR") {
    return null;
  }
  const value =
    typeof price === "number" ? price : typeof price === "string" ? parseFloat(price) : NaN;
  // Math.round sur la valeur en euros, jamais une multiplication flottante
  // non arrondie.
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
}

// Ne lève jamais d'exception : retourne null sur tout échec (clé absente,
// timeout, erreur HTTP, produit introuvable, réponse inattendue) pour que
// l'appelant (scrapeArticleUrl) sache qu'il doit retomber sur ScrapingAnt,
// à distinguer d'un résultat à champs vides qui serait, lui, un vrai
// résultat Bright Data sans donnée trouvée.
export async function fetchAmazonProductViaBrightData(url: string): Promise<ScrapedArticle | null> {
  if (!BRIGHTDATA_API_KEY) {
    console.log("[scrape] BRIGHTDATA_API_KEY absente, repli sur ScrapingAnt pour Amazon");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.brightdata.com/datasets/v3/scrape?dataset_id=${DATASET_ID}&format=json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BRIGHTDATA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ url }]),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.log(`[scrape] Bright Data : réponse ${response.status}, repli sur ScrapingAnt`);
      return null;
    }

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data) || data.length === 0) {
      console.log("[scrape] Bright Data : réponse vide ou de forme inattendue, repli sur ScrapingAnt");
      return null;
    }

    const product = data[0] as Record<string, unknown>;

    // Bascule en asynchrone côté Bright Data (HTTP 202 + snapshot_id à
    // interroger séparément) — non géré ici, "ne devrait pas arriver pour
    // une seule URL produit" (voir CLAUDE.md). Traité comme un échec propre
    // plutôt qu'une tentative de polling.
    if (typeof product.snapshot_id === "string" && typeof product.title !== "string") {
      console.log("[scrape] Bright Data : requête basculée en asynchrone (snapshot_id), repli sur ScrapingAnt");
      return null;
    }

    const title = typeof product.title === "string" ? product.title.trim() || null : null;
    const imageCandidate =
      product.image_url ??
      product.image ??
      (Array.isArray(product.images) ? product.images[0] : undefined);
    const imageUrl = typeof imageCandidate === "string" ? imageCandidate : null;
    // final_price (prix actuel, déjà remisé) préféré à initial_price (prix
    // barré) — identiques hors remise, voir commentaire de mapping ci-dessus.
    const priceCents =
      parsePriceCents(product.final_price, product.currency) ??
      parsePriceCents(product.initial_price, product.currency);

    if (!title && priceCents === null && !imageUrl) {
      console.log("[scrape] Bright Data : produit introuvable ou aucune donnée exploitable, repli sur ScrapingAnt");
      return null;
    }

    // originalTitle toujours null ici : le titre brut passe ensuite par le
    // même shortenTitle unique que toutes les autres sources, appliqué en
    // aval dans scrapeArticleUrl — pas de troncature séparée ici.
    return { title, originalTitle: null, priceCents, imageUrl };
  } catch (error) {
    console.log(
      "[scrape] Bright Data injoignable —",
      error instanceof Error ? error.message : error,
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
