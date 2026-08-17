"use server";

import { parseArticleMetadata, type ScrapedArticle } from "@/lib/scrape-article";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TIMEOUT_MS = 8000;

const EMPTY_RESULT: ScrapedArticle = { title: null, priceCents: null, imageUrl: null };

// Service de scraping tiers ScrapingAnt (voir CLAUDE.md > "Service de
// scraping tiers — ScrapingAnt"). Beaucoup de sites marchands protégés par
// Cloudflare bloquent les IP des fonctions Vercel par réputation ; le relais
// Hostinger tenté avant ScrapingAnt s'est révélé tout aussi bloqué et a été
// abandonné. ScrapingAnt gère cette partie pour nous — tout le parsing reste
// ici, source unique (ne jamais dupliquer parseArticleMetadata côté tiers).
const SCRAPINGANT_API_KEY = process.env.SCRAPINGANT_API_KEY;

// Un seul appel à ScrapingAnt. Ne lève jamais d'exception.
async function scrapingAntAttempt(
  targetUrl: string,
): Promise<{ html: string | null; status: number | null }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const requestUrl = new URL("https://api.scrapingant.com/v2/general");
    requestUrl.searchParams.set("url", targetUrl);
    requestUrl.searchParams.set("x-api-key", SCRAPINGANT_API_KEY!);
    // browser=false : pas de rendu JavaScript (inutile ici, JSON-LD/Open
    // Graph sont déjà dans le HTML servi), 1 crédit par requête au lieu de
    // 10 — voir CLAUDE.md.
    requestUrl.searchParams.set("browser", "false");

    const response = await fetch(requestUrl.toString(), { signal: controller.signal });
    if (!response.ok) {
      return { html: null, status: response.status };
    }

    return { html: await response.text(), status: response.status };
  } catch (error) {
    console.log(
      `[scrape] ScrapingAnt injoignable —`,
      error instanceof Error ? error.message : error,
    );
    return { html: null, status: null };
  } finally {
    clearTimeout(timeout);
  }
}

// Tente ScrapingAnt. Retourne le HTML si ça marche, null sinon — jamais
// d'exception, l'appelant retombe alors sur le fetch direct.
async function fetchViaScrapingAnt(targetUrl: string): Promise<string | null> {
  if (!SCRAPINGANT_API_KEY) {
    console.log("[scrape] SCRAPINGANT_API_KEY absente, repli direct sans passer par ScrapingAnt");
    return null;
  }

  let attempt = await scrapingAntAttempt(targetUrl);

  // 423 : ScrapingAnt indique lui-même que le site cible a détecté la
  // requête et recommande de réessayer (proxy différent à la reprise) —
  // une seule nouvelle tentative suffit la plupart du temps, vérifié en
  // conditions réelles.
  if (attempt.status === 423) {
    console.log("[scrape] ScrapingAnt : réponse 423, nouvelle tentative");
    attempt = await scrapingAntAttempt(targetUrl);
  }

  if (!attempt.html) {
    console.log(
      `[scrape] ScrapingAnt : ${attempt.status ? `réponse ${attempt.status}` : "échec réseau"}, repli sur le fetch direct`,
    );
    return null;
  }

  return attempt.html;
}

// Comportement historique (avant ScrapingAnt) : fetch direct depuis Vercel.
// Reste le seul chemin quand ScrapingAnt n'est pas configuré, et le repli
// quand il échoue.
async function fetchDirect(parsedUrl: URL): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.log(`[scrape] ${parsedUrl.hostname} : réponse ${response.status}, abandon`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.log(
      `[scrape] ${parsedUrl.hostname} : erreur réseau ou timeout —`,
      error instanceof Error ? error.message : error,
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Ne jamais lever d'erreur ici : le formulaire doit rester utilisable
// manuellement si le scraping échoue ou dépasse le timeout.
export async function scrapeArticleUrl(url: string): Promise<ScrapedArticle> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return EMPTY_RESULT;
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return EMPTY_RESULT;
  }

  const html =
    (await fetchViaScrapingAnt(parsedUrl.toString())) ?? (await fetchDirect(parsedUrl));

  if (!html) return EMPTY_RESULT;

  const result = parseArticleMetadata(html, parsedUrl.toString());

  if (!result.title && result.priceCents === null && !result.imageUrl) {
    // Diagnostic (17 août 2026) : identifier si un site renvoie une page de
    // vérification anti-bot (Cloudflare/PerimeterX/DataDome...) plutôt
    // qu'un vrai échec de parsing — voir CLAUDE.md > Scraping.
    const looksLikeBotChallenge =
      /just a moment|checking your browser|cf-browser-verification|attention required|enable javascript and cookies|captcha|access denied|request blocked/i.test(
        html,
      );
    console.log(
      `[scrape] ${parsedUrl.hostname} : ${html.length} caractères reçus, aucune donnée extraite` +
        (looksLikeBotChallenge
          ? " — la page ressemble à une vérification anti-bot"
          : ""),
    );
  }

  return result;
}
