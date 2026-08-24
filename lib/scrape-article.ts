import * as cheerio from "cheerio";

export interface ScrapedArticle {
  title: string | null;
  originalTitle: string | null;
  priceCents: number | null;
  imageUrl: string | null;
}

// Raccourcissement automatique d'un titre scrapé trop long (Amazon en
// particulier renvoie des titres bourrés de mots-clés SEO), voir CLAUDE.md >
// "Raccourcissement automatique du titre scrapé". Ne touche pas aux titres
// déjà raisonnables : originalTitle reste alors null.
const SANS_RACCOURCISSEMENT = 90;
const SEPARATEUR_MIN = 15;
const SEPARATEUR_MAX = 90;
const TRONCATURE_CIBLE = 60;

export function shortenTitle(rawTitle: string): { title: string; originalTitle: string | null } {
  const titre = rawTitle.trim();
  if (titre.length <= SANS_RACCOURCISSEMENT) {
    return { title: titre, originalTitle: null };
  }

  // Séparateur assez tôt (" : " ou " | ", fréquent chez Amazon — le vrai nom
  // du produit précède souvent) : coupe au premier trouvé dans la fourchette.
  const positions = [" : ", " | "]
    .map((separateur) => titre.indexOf(separateur))
    .filter((index) => index >= SEPARATEUR_MIN && index <= SEPARATEUR_MAX);
  if (positions.length > 0) {
    const coupeA = Math.min(...positions);
    return { title: titre.slice(0, coupeA).trim(), originalTitle: titre };
  }

  // Repli : tronque à ~60 caractères sur une limite de mot, jamais au
  // milieu d'un mot.
  const tranche = titre.slice(0, TRONCATURE_CIBLE);
  const dernierEspace = tranche.lastIndexOf(" ");
  const coupe = dernierEspace > 0 ? tranche.slice(0, dernierEspace) : tranche;
  return { title: `${coupe.trim()}…`, originalTitle: titre };
}

function toAbsoluteUrl(possibleUrl: string, baseUrl: string): string | null {
  try {
    return new URL(possibleUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

function firstImageString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstImageString(item);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object" && "url" in value) {
    return firstImageString((value as { url: unknown }).url);
  }
  return null;
}

function extractJsonLdNodes(json: unknown): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (Array.isArray(obj["@graph"])) {
        (obj["@graph"] as unknown[]).forEach(visit);
      }
      nodes.push(obj);
    }
  };
  visit(json);
  return nodes;
}

function isProductType(type: unknown): boolean {
  if (typeof type === "string") return type.toLowerCase() === "product";
  if (Array.isArray(type)) {
    return type.some((t) => typeof t === "string" && t.toLowerCase() === "product");
  }
  return false;
}

function parsePriceToCents(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw * 100) : null;
  }
  if (typeof raw !== "string") return null;

  const cleaned = raw.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastComma !== -1 && lastDot !== -1) {
    normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (lastComma !== -1) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const value = parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
}

// Ordre de priorité imposé par CLAUDE.md > "Scraping des métadonnées d'article" :
// 1. JSON-LD Product/Offer (le plus fiable pour le prix)
// 2. Balises Open Graph
// 3. <title> en dernier recours, pour le titre uniquement
// 4. Aucun prix trouvé -> champ laissé vide, jamais de valeur inventée
export function parseArticleMetadata(html: string, baseUrl: string): ScrapedArticle {
  const $ = cheerio.load(html);

  let title: string | null = null;
  let priceCents: number | null = null;
  let imageUrl: string | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    if (title && priceCents !== null && imageUrl) return;

    const raw = $(el).text();
    if (!raw) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }

    const product = extractJsonLdNodes(parsed).find((node) => isProductType(node["@type"]));
    if (!product) return;

    if (!title && typeof product.name === "string") {
      title = product.name;
    }
    if (!imageUrl) {
      const img = firstImageString(product.image);
      if (img) imageUrl = toAbsoluteUrl(img, baseUrl);
    }
    if (priceCents === null) {
      const offers = product.offers;
      const offer = Array.isArray(offers) ? offers[0] : offers;
      if (offer && typeof offer === "object") {
        priceCents = parsePriceToCents((offer as Record<string, unknown>).price);
      }
    }
  });

  if (!title) {
    title = $('meta[property="og:title"]').attr("content")?.trim() || null;
  }
  if (!imageUrl) {
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) imageUrl = toAbsoluteUrl(ogImage, baseUrl);
  }
  if (priceCents === null) {
    const ogPrice =
      $('meta[property="og:price:amount"]').attr("content") ||
      $('meta[property="product:price:amount"]').attr("content");
    if (ogPrice) priceCents = parsePriceToCents(ogPrice);
  }

  // Repli microdonnées (schema.org itemprop) : certains sites n'exposent le
  // Product qu'ainsi, sans JSON-LD ni Open Graph complet.
  if (!title) {
    title = $('[itemprop="name"]').first().text().trim() || null;
  }
  if (!imageUrl) {
    const itemImage = $('[itemprop="image"]').first();
    const src = itemImage.attr("content") || itemImage.attr("src");
    if (src) imageUrl = toAbsoluteUrl(src, baseUrl);
  }
  if (priceCents === null) {
    const itemPrice = $('[itemprop="price"]').first();
    const raw = itemPrice.attr("content") || itemPrice.text();
    if (raw) priceCents = parsePriceToCents(raw);
  }

  // Repli Amazon : ni JSON-LD ni Open Graph sur ses pages produit. Titre,
  // image et prix y sont à des emplacements stables tant qu'on cible
  // précisément le conteneur du prix affiché ("buybox"), voir CLAUDE.md >
  // "Prix Amazon réactivé (20 août 2026)". Décision initiale du 17 août
  // (aucun repli prix) inversée : la cause du prix parfois faux n'était pas
  // Amazon en général mais un sélecteur non scopé (`.a-price .a-offscreen`
  // seul matche aussi les prix des produits sponsorisés/associés ailleurs
  // sur la page) — en le scopant au conteneur du prix principal, le
  // problème disparaît. Liste ordonnée par fiabilité décroissante, le
  // premier sélecteur qui matche un prix parsable gagne ; comme pour
  // titre/image, jamais de prix inventé si aucun ne matche (résultat null).
  if (!title) {
    title = $("#productTitle").first().text().trim() || null;
  }
  if (priceCents === null) {
    const amazonPriceSelectors = [
      "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
      "#corePrice_feature_div .a-price .a-offscreen",
      ".priceToPay .a-offscreen",
      ".apexPriceToPay .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
    ];
    for (const selector of amazonPriceSelectors) {
      const raw = $(selector).first().text().trim();
      if (!raw) continue;
      const parsed = parsePriceToCents(raw);
      if (parsed !== null) {
        priceCents = parsed;
        break;
      }
    }
  }
  if (!imageUrl) {
    const landing = $("#landingImage, #imgTagWrapperId img").first();
    const dynamicImage = landing.attr("data-a-dynamic-image");
    if (dynamicImage) {
      try {
        const sizes = JSON.parse(dynamicImage) as Record<string, unknown>;
        const firstUrl = Object.keys(sizes)[0];
        if (firstUrl) imageUrl = toAbsoluteUrl(firstUrl, baseUrl);
      } catch {
        // ignore, on retombe sur src/data-old-hires ci-dessous
      }
    }
    if (!imageUrl) {
      const src = landing.attr("src") || landing.attr("data-old-hires");
      if (src) imageUrl = toAbsoluteUrl(src, baseUrl);
    }
  }

  if (!title) {
    const pageTitle = $("title").first().text().trim();
    title = pageTitle || null;
  }

  return { title, originalTitle: null, priceCents, imageUrl };
}
