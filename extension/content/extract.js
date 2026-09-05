// Extraction des métadonnées d'un produit depuis la page déjà ouverte (DOM
// natif, JS exécuté inclus) — voir CLAUDE.md > "Extension navigateur Chrome".
//
// Reprend le même ordre de priorité que le pipeline serveur
// (lib/scrape-article.ts : JSON-LD -> Open Graph -> microdonnées -> repli
// Amazon -> repli générique sur les sélecteurs de prix visibles -> <title>
// en dernier recours) mais réimplémenté en DOM natif, pas cheerio — deux
// implémentations distinctes à garder alignées manuellement si la logique
// évolue d'un côté, voir la note dans CLAUDE.md.
//
// Fonction volontairement autonome (toutes les fonctions utilitaires
// imbriquées dedans, aucune référence externe) : elle est injectée telle
// quelle dans la page active via `chrome.scripting.executeScript({ func })`,
// qui sérialise/réexécute la fonction dans le monde isolé de l'onglet cible
// — toute référence à une variable extérieure à cette fonction serait perdue.
export function extractProductFromPage() {
  function toAbsoluteUrl(possibleUrl, baseUrl) {
    try {
      return new URL(possibleUrl, baseUrl).toString();
    } catch {
      return null;
    }
  }

  function firstImageString(value) {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = firstImageString(item);
        if (found) return found;
      }
      return null;
    }
    if (value && typeof value === "object" && "url" in value) {
      return firstImageString(value.url);
    }
    return null;
  }

  // Mêmes clés d'imbrication que côté serveur, voir CLAUDE.md > "Fiabilisation
  // du scraping multi-marchands".
  const JSONLD_WRAPPER_KEYS = ["mainEntity", "itemOffered", "about", "subjectOf"];

  function extractJsonLdNodes(json) {
    const nodes = [];
    const visit = (value) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value && typeof value === "object") {
        if (Array.isArray(value["@graph"])) {
          value["@graph"].forEach(visit);
        }
        for (const key of JSONLD_WRAPPER_KEYS) {
          if (value[key] && typeof value[key] === "object") {
            visit(value[key]);
          }
        }
        nodes.push(value);
      }
    };
    visit(json);
    return nodes;
  }

  function isProductType(type) {
    if (typeof type === "string") return type.toLowerCase() === "product";
    if (Array.isArray(type)) {
      return type.some((t) => typeof t === "string" && t.toLowerCase() === "product");
    }
    return false;
  }

  function parsePriceToCents(raw) {
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

  // Devise détectée en cours de route — si un prix trouvé s'avère dans une
  // devise autre qu'EUR, on l'abandonne plutôt que de stocker un montant
  // dans la mauvaise devise (rare sur un site .fr, mais possible). `null`
  // = devise jamais explicitement trouvée, on ne bloque pas dans ce cas.
  let deviseDetectee = null;
  function noterDevise(raw) {
    if (typeof raw !== "string" || !raw.trim()) return;
    deviseDetectee = raw.trim().toUpperCase();
  }

  function extractPriceFromOffers(offers) {
    if (!offers) return null;

    if (Array.isArray(offers)) {
      for (const offer of offers) {
        const price = extractPriceFromOffers(offer);
        if (price !== null) return price;
      }
      return null;
    }

    if (typeof offers !== "object") return null;
    const offer = offers;

    if (typeof offer.priceCurrency === "string") noterDevise(offer.priceCurrency);

    const direct = parsePriceToCents(offer.price);
    if (direct !== null) return direct;

    if (offer.priceSpecification && typeof offer.priceSpecification === "object") {
      const spec = offer.priceSpecification;
      if (typeof spec.priceCurrency === "string") noterDevise(spec.priceCurrency);
      const fromSpec = parsePriceToCents(spec.price);
      if (fromSpec !== null) return fromSpec;
    }

    const low = parsePriceToCents(offer.lowPrice);
    if (low !== null) return low;

    if (offer.offers) {
      const nested = extractPriceFromOffers(offer.offers);
      if (nested !== null) return nested;
    }

    return null;
  }

  // Sélecteurs de prix visibles génériques — même liste que
  // GENERIC_PRICE_SELECTORS côté serveur (lib/scrape-article.ts). Prix
  // uniquement, jamais l'image (voir la justification côté serveur).
  const GENERIC_PRICE_SELECTORS = [
    '[itemprop="price"]',
    "[data-price]",
    '[class*="price"]',
    '[data-testid*="price"]',
  ];
  const CLASSE_A_EXCLURE = /(old|barre|strike)/i;

  function findGenericVisiblePrice() {
    for (const selector of GENERIC_PRICE_SELECTORS) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (CLASSE_A_EXCLURE.test(el.className || "")) continue;
        const raw = el.getAttribute("content") || el.getAttribute("data-price") || el.textContent;
        const parsed = parsePriceToCents(raw);
        if (parsed !== null) return parsed;
      }
    }
    return null;
  }

  const baseUrl = document.baseURI || location.href;
  let title = null;
  let priceCents = null;
  let imageUrl = null;

  // 1. JSON-LD Product/Offer.
  document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    if (title && priceCents !== null && imageUrl) return;
    let parsed;
    try {
      parsed = JSON.parse(el.textContent || "");
    } catch {
      return;
    }
    const products = extractJsonLdNodes(parsed).filter((node) => isProductType(node["@type"]));
    for (const product of products) {
      if (!title && typeof product.name === "string") title = product.name;
      if (!imageUrl) {
        const img = firstImageString(product.image);
        if (img) imageUrl = toAbsoluteUrl(img, baseUrl);
      }
      if (priceCents === null) priceCents = extractPriceFromOffers(product.offers);
      if (title && priceCents !== null && imageUrl) break;
    }
  });

  // 2. Open Graph.
  if (!title) {
    title = document.querySelector('meta[property="og:title"]')?.getAttribute("content")?.trim() || null;
  }
  if (!imageUrl) {
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (ogImage) imageUrl = toAbsoluteUrl(ogImage, baseUrl);
  }
  if (priceCents === null) {
    const ogCurrency =
      document.querySelector('meta[property="og:price:currency"]')?.getAttribute("content") ||
      document.querySelector('meta[property="product:price:currency"]')?.getAttribute("content");
    if (ogCurrency) noterDevise(ogCurrency);
    const ogPrice =
      document.querySelector('meta[property="og:price:amount"]')?.getAttribute("content") ||
      document.querySelector('meta[property="product:price:amount"]')?.getAttribute("content");
    if (ogPrice) priceCents = parsePriceToCents(ogPrice);
  }

  // 3. Microdonnées schema.org.
  if (!title) {
    title = document.querySelector('[itemprop="name"]')?.textContent?.trim() || null;
  }
  if (!imageUrl) {
    const itemImage = document.querySelector('[itemprop="image"]');
    const src = itemImage?.getAttribute("content") || itemImage?.getAttribute("src");
    if (src) imageUrl = toAbsoluteUrl(src, baseUrl);
  }
  if (priceCents === null) {
    const itemPrice = document.querySelector('[itemprop="price"]');
    const raw = itemPrice?.getAttribute("content") || itemPrice?.textContent;
    if (raw) priceCents = parsePriceToCents(raw);
  }

  // 4. Repli Amazon (mêmes sélecteurs que côté serveur, voir "Prix Amazon
  // réactivé" dans CLAUDE.md) — uniquement sur un domaine amazon.
  const estAmazon = /(^|\.)amazon\.[a-z.]+$/i.test(location.hostname);
  if (estAmazon) {
    if (!title) {
      title = document.querySelector("#productTitle")?.textContent?.trim() || null;
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
        const raw = document.querySelector(selector)?.textContent?.trim();
        if (!raw) continue;
        const parsed = parsePriceToCents(raw);
        if (parsed !== null) {
          priceCents = parsed;
          break;
        }
      }
    }
    if (!imageUrl) {
      const landing = document.querySelector("#landingImage, #imgTagWrapperId img");
      const dynamicImage = landing?.getAttribute("data-a-dynamic-image");
      if (dynamicImage) {
        try {
          const sizes = JSON.parse(dynamicImage);
          const firstUrl = Object.keys(sizes)[0];
          if (firstUrl) imageUrl = toAbsoluteUrl(firstUrl, baseUrl);
        } catch {
          // ignore, on retombe sur src/data-old-hires ci-dessous
        }
      }
      if (!imageUrl) {
        const src = landing?.getAttribute("src") || landing?.getAttribute("data-old-hires");
        if (src) imageUrl = toAbsoluteUrl(src, baseUrl);
      }
    }
  }

  // 5. Repli générique sur les sélecteurs de prix visibles (prix uniquement).
  if (priceCents === null) {
    priceCents = findGenericVisiblePrice();
  }

  // 6. <title> en dernier recours, pour le titre seul.
  if (!title) {
    title = document.title?.trim() || null;
  }

  // Devise détectée mais différente d'EUR : prix abandonné plutôt que
  // stocké dans la mauvaise devise (voir CLAUDE.md > "Extension navigateur
  // Chrome" > "Devise").
  if (deviseDetectee && deviseDetectee !== "EUR" && deviseDetectee !== "€") {
    priceCents = null;
  }

  return {
    title,
    priceCents,
    imageUrl,
    sourceUrl: location.href,
  };
}
