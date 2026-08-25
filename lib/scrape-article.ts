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

// Clés d'imbrication fréquentes qui enveloppent un vrai noeud Product sans que
// celui-ci soit au premier niveau ni dans un @graph — vu en pratique sur des
// pages qui décrivent la page (WebPage) plutôt que directement le produit.
// Diagnostic 24-25 août 2026, voir CLAUDE.md > "Fiabilisation du scraping
// multi-marchands".
const JSONLD_WRAPPER_KEYS = ["mainEntity", "itemOffered", "about", "subjectOf"];

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
      for (const key of JSONLD_WRAPPER_KEYS) {
        if (obj[key] && typeof obj[key] === "object") {
          visit(obj[key]);
        }
      }
      nodes.push(obj);
    }
  };
  visit(json);
  return nodes;
}

// Cherche un prix dans un noeud "offers" quelle que soit sa forme : Offer
// unique, tableau d'Offer (plusieurs vendeurs/variantes — on garde le premier
// qui donne un prix exploitable plutôt que de s'arrêter au tout premier,
// parfois une variante indisponible sans prix), AggregateOffer
// (lowPrice/highPrice, ou un tableau imbriqué sous offers.offers), ou prix
// exprimé via priceSpecification.price plutôt que price directement.
function extractPriceFromOffers(offers: unknown): number | null {
  if (!offers) return null;

  if (Array.isArray(offers)) {
    for (const offer of offers) {
      const price = extractPriceFromOffers(offer);
      if (price !== null) return price;
    }
    return null;
  }

  if (typeof offers !== "object") return null;
  const offer = offers as Record<string, unknown>;

  const direct = parsePriceToCents(offer.price);
  if (direct !== null) return direct;

  if (offer.priceSpecification && typeof offer.priceSpecification === "object") {
    const spec = offer.priceSpecification as Record<string, unknown>;
    const fromSpec = parsePriceToCents(spec.price);
    if (fromSpec !== null) return fromSpec;
  }

  // AggregateOffer : pas un prix unique, on prend le plus bas (celui montré
  // en avant sur la fiche produit dans l'immense majorité des cas).
  const low = parsePriceToCents(offer.lowPrice);
  if (low !== null) return low;

  if (offer.offers) {
    const nested = extractPriceFromOffers(offer.offers);
    if (nested !== null) return nested;
  }

  return null;
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

// Repli "state embarqué" (24-25 août 2026, voir CLAUDE.md > "Fiabilisation du
// scraping multi-marchands") : beaucoup de sites français reconstruits ces
// dernières années tournent sur Next.js ou Nuxt.js et embarquent tout leur
// state de page (y compris le prix affiché) en JSON pour l'hydratation
// côté client — même quand ce prix n'apparaît, côté HTML visible, que dans
// un gabarit non résolu (ex. Decathlon : la fiche produit affiche
// littéralement "{{currentPrice}}" dans le HTML servi, la vraie valeur ne
// venant qu'après exécution du JavaScript, jamais fait par notre fetch
// serveur). Ce JSON embarqué, lui, est déjà résolu server-side et bien plus
// fiable qu'un scan de texte visible. On y cherche uniquement de quoi
// compléter les champs encore manquants après JSON-LD/OG/microdonnées —
// jamais pour écraser une valeur déjà trouvée.
function extractEmbeddedFrameworkJson($: cheerio.CheerioAPI): unknown[] {
  const blobs: unknown[] = [];

  const nextData = $("#__NEXT_DATA__").first().text();
  if (nextData) {
    try {
      blobs.push(JSON.parse(nextData));
    } catch {
      // ignore, JSON malformé ou tronqué
    }
  }

  // Nuxt.js expose son state via un script inline classique
  // `window.__NUXT__={...}` plutôt qu'un bloc JSON pur — on isole l'objet
  // par une regex tolérante puis on tente le parse.
  $("script:not([src])").each((_, el) => {
    const raw = $(el).text();
    if (!raw || !raw.includes("__NUXT__")) return;
    const match = raw.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*\});?\s*$/);
    if (!match) return;
    try {
      blobs.push(JSON.parse(match[1]));
    } catch {
      // ignore, souvent du JS (fonctions, undefined) plutôt que du JSON
      // strict côté Nuxt — pas grave, c'est un repli parmi d'autres.
    }
  });

  return blobs;
}

// Cherche dans un blob JSON quelconque le premier objet qui ressemble à un
// produit (a un champ nom/titre ET un champ prix numérique plausible) et en
// tire ce qu'on peut. Profondeur bornée pour éviter de tourner en rond sur
// un state de page qui peut être volumineux.
function findProductLikeInEmbeddedJson(
  value: unknown,
  depth = 0,
): { title: string | null; priceCents: number | null; imageUrl: string | null } | null {
  if (depth > 8 || !value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProductLikeInEmbeddedJson(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const obj = value as Record<string, unknown>;
  const nameKey = ["title", "name", "productName", "displayName"].find(
    (k) => typeof obj[k] === "string" && (obj[k] as string).trim().length > 0,
  );
  const priceKey = ["price", "currentPrice", "sellingPrice", "priceValue"].find(
    (k) => parsePriceToCents(obj[k]) !== null,
  );

  if (nameKey && priceKey) {
    const imageKey = ["image", "imageUrl", "mainImage", "thumbnail"].find((k) => obj[k]);
    const rawImage = imageKey ? firstImageString(obj[imageKey]) : null;
    return {
      title: (obj[nameKey] as string).trim(),
      priceCents: parsePriceToCents(obj[priceKey]),
      imageUrl: rawImage,
    };
  }

  for (const key of Object.keys(obj)) {
    // On évite de redescendre dans des sous-arbres manifestement énormes et
    // hors-sujet (navigation, traductions...) pour rester rapide.
    if (/^(nav|menu|translations?|i18n|header|footer)$/i.test(key)) continue;
    const found = findProductLikeInEmbeddedJson(obj[key], depth + 1);
    if (found) return found;
  }

  return null;
}

// Dernier recours pour le prix uniquement (jamais pour l'image : trop
// risqué de choper un visuel sans rapport — logo, bannière — alors qu'un
// prix qui ne ressemble à rien se détecte déjà par parsePriceToCents qui
// renvoie null sur du texte non numérique). Liste de sélecteurs génériques
// vus fréquemment tous marchands confondus, jamais un sélecteur non scopé
// unique (leçon retenue du repli Amazon initial, voir CLAUDE.md > "Prix
// Amazon réactivé") : on prend le premier qui matche un prix parsable, on ne
// s'arrête pas au premier élément qui matche juste le sélecteur.
const GENERIC_PRICE_SELECTORS = [
  '[itemprop="price"]',
  "[data-price]",
  '[class*="price" i]:not([class*="old" i]):not([class*="barre" i]):not([class*="strike" i])',
  '[data-testid*="price" i]',
];

function findGenericVisiblePrice($: cheerio.CheerioAPI): number | null {
  for (const selector of GENERIC_PRICE_SELECTORS) {
    let found: number | null = null;
    $(selector).each((_, el) => {
      if (found !== null) return;
      const node = $(el);
      const raw = node.attr("content") || node.attr("data-price") || node.text();
      const parsed = parsePriceToCents(raw);
      if (parsed !== null) found = parsed;
    });
    if (found !== null) return found;
  }
  return null;
}

// Ordre de priorité imposé par CLAUDE.md > "Scraping des métadonnées d'article" :
// 1. JSON-LD Product/Offer (le plus fiable pour le prix)
// 2. Balises Open Graph
// 3. Microdonnées schema.org
// 4. Repli Amazon spécifique
// 5. State embarqué Next.js/Nuxt.js (voir CLAUDE.md > "Fiabilisation du
//    scraping multi-marchands")
// 6. Repli générique sur les sélecteurs de prix visibles (prix uniquement)
// 7. <title> en dernier recours, pour le titre uniquement
// 8. Aucun prix trouvé -> champ laissé vide, jamais de valeur inventée
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

    // Une page peut contenir plusieurs noeuds Product (le produit principal,
    // et parfois des suggestions "vous aimerez aussi" en rich snippet) — on
    // essaie chacun dans l'ordre et on garde le premier qui apporte une
    // information utile, plutôt que de s'arrêter au tout premier trouvé qui
    // pourrait n'avoir ni prix ni image exploitables.
    const products = extractJsonLdNodes(parsed).filter((node) => isProductType(node["@type"]));
    for (const product of products) {
      if (!title && typeof product.name === "string") {
        title = product.name;
      }
      if (!imageUrl) {
        const img = firstImageString(product.image);
        if (img) imageUrl = toAbsoluteUrl(img, baseUrl);
      }
      if (priceCents === null) {
        priceCents = extractPriceFromOffers(product.offers);
      }
      if (title && priceCents !== null && imageUrl) break;
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

  // Repli "state embarqué" Next.js/Nuxt.js — voir le commentaire détaillé au
  // niveau de extractEmbeddedFrameworkJson ci-dessus. Ne comble que les
  // champs encore manquants à ce stade.
  if (!title || priceCents === null || !imageUrl) {
    for (const blob of extractEmbeddedFrameworkJson($)) {
      const found = findProductLikeInEmbeddedJson(blob);
      if (!found) continue;
      if (!title && found.title) title = found.title;
      if (priceCents === null && found.priceCents !== null) priceCents = found.priceCents;
      if (!imageUrl && found.imageUrl) imageUrl = toAbsoluteUrl(found.imageUrl, baseUrl);
      if (title && priceCents !== null && imageUrl) break;
    }
  }

  // Repli générique sur les sélecteurs de prix visibles — prix uniquement,
  // voir le commentaire détaillé au niveau de findGenericVisiblePrice.
  if (priceCents === null) {
    priceCents = findGenericVisiblePrice($);
  }

  if (!title) {
    const pageTitle = $("title").first().text().trim();
    title = pageTitle || null;
  }

  return { title, originalTitle: null, priceCents, imageUrl };
}
