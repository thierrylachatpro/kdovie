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
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: controller.signal,
    });
    if (!response.ok) return EMPTY_RESULT;

    const html = await response.text();
    return parseArticleMetadata(html, parsedUrl.toString());
  } catch {
    return EMPTY_RESULT;
  } finally {
    clearTimeout(timeout);
  }
}
