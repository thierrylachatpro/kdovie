"use server";

import { parseArticleMetadata, type ScrapedArticle } from "@/lib/scrape-article";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TIMEOUT_MS = 8000;

const EMPTY_RESULT: ScrapedArticle = { title: null, priceCents: null, imageUrl: null };

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
      console.log(
        `[scrape] ${parsedUrl.hostname} : réponse ${response.status}, abandon`,
      );
      return EMPTY_RESULT;
    }

    const html = await response.text();
    const result = parseArticleMetadata(html, parsedUrl.toString());

    if (!result.title && result.priceCents === null && !result.imageUrl) {
      // Diagnostic temporaire (17 août 2026) : identifier si un site renvoie
      // une page de vérification anti-bot (Cloudflare/PerimeterX/DataDome...)
      // plutôt qu'un vrai échec de parsing — voir CLAUDE.md > Scraping.
      const looksLikeBotChallenge =
        /just a moment|checking your browser|cf-browser-verification|attention required|enable javascript and cookies|captcha|access denied|request blocked/i.test(
          html,
        );
      console.log(
        `[scrape] ${parsedUrl.hostname} : statut ${response.status}, ${html.length} caractères reçus, aucune donnée extraite` +
          (looksLikeBotChallenge
            ? " — la page ressemble à une vérification anti-bot"
            : ""),
      );
    }

    return result;
  } catch (error) {
    console.log(
      `[scrape] ${parsedUrl.hostname} : erreur réseau ou timeout —`,
      error instanceof Error ? error.message : error,
    );
    return EMPTY_RESULT;
  } finally {
    clearTimeout(timeout);
  }
}
