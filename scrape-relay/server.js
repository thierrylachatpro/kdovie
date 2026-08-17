"use strict";

// Relais de scraping Kdovie (voir CLAUDE.md > "Relais de scraping via
// Hostinger"). Reçoit une URL, fait le fetch de la page produit depuis
// cet hébergement (IP française, pas datacenter cloud), renvoie le HTML
// brut. Ne fait AUCUN parsing : lib/scrape-article.ts côté Vercel reste la
// source unique pour l'extraction JSON-LD/Open Graph/microdonnées/Amazon.

const express = require("express");

const PORT = process.env.PORT || 3000;
const RELAY_SECRET = process.env.RELAY_SECRET;
const TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

if (!RELAY_SECRET) {
  console.warn(
    "RELAY_SECRET n'est pas défini dans l'environnement : le relais refusera toutes les requêtes /scrape.",
  );
}

const app = express();

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/scrape", async (req, res) => {
  if (!RELAY_SECRET || req.get("x-relay-secret") !== RELAY_SECRET) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const targetUrl = req.query.url;
  if (typeof targetUrl !== "string" || !targetUrl) {
    res.status(400).json({ ok: false, error: "missing_url" });
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    res.status(400).json({ ok: false, error: "invalid_url" });
    return;
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    res.status(400).json({ ok: false, error: "invalid_protocol" });
    return;
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
      res.status(502).json({ ok: false, error: `upstream_status_${response.status}` });
      return;
    }

    const html = await response.text();
    res.json({ ok: true, html });
  } catch {
    res.status(504).json({ ok: false, error: "fetch_failed_or_timeout" });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
  console.log(`Relais de scraping Kdovie à l'écoute sur le port ${PORT}`);
});
