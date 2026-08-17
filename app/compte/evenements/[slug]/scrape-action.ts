"use server";

import { parseArticleMetadata, type ScrapedArticle } from "@/lib/scrape-article";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TIMEOUT_MS = 8000;

const EMPTY_RESULT: ScrapedArticle = { title: null, priceCents: null, imageUrl: null };

// Relais de scraping Hostinger (voir CLAUDE.md > "Relais de scraping via
// Hostinger", code du relais dans scrape-relay/). Beaucoup de sites
// marchands protégés par Cloudflare bloquent les IP des fonctions Vercel
// par réputation. Le relais fait juste le fetch depuis une IP française
// non-datacenter ; tout le parsing reste ici, source unique — ne jamais
// dupliquer parseArticleMetadata côté relais.
const RELAY_URL = process.env.SCRAPE_RELAY_URL;
const RELAY_SECRET = process.env.SCRAPE_RELAY_SECRET;

// Tente le relais Hostinger. Retourne le HTML si ça marche, null sinon —
// jamais d'exception, l'appelant retombe alors sur le fetch direct.
async function fetchViaRelay(targetUrl: string): Promise<string | null> {
  if (!RELAY_URL || !RELAY_SECRET) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const relayRequestUrl = new URL(RELAY_URL);
    relayRequestUrl.searchParams.set("url", targetUrl);

    const response = await fetch(relayRequestUrl.toString(), {
      headers: { "x-relay-secret": RELAY_SECRET },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.log(
        `[scrape] relais Hostinger : réponse ${response.status}, repli sur le fetch direct`,
      );
      return null;
    }

    const body = (await response.json()) as { ok: boolean; html?: string; error?: string };
    if (!body.ok || !body.html) {
      console.log(
        `[scrape] relais Hostinger : ${body.error ?? "échec inconnu"}, repli sur le fetch direct`,
      );
      return null;
    }

    return body.html;
  } catch (error) {
    console.log(
      `[scrape] relais Hostinger injoignable, repli sur le fetch direct —`,
      error instanceof Error ? error.message : error,
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Comportement historique (avant le relais) : fetch direct depuis Vercel.
// Reste le seul chemin quand le relais n'est pas configuré, et le repli
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
    (await fetchViaRelay(parsedUrl.toString())) ?? (await fetchDirect(parsedUrl));

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
