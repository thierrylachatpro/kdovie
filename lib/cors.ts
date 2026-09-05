// CORS pour les routes appelées depuis l'extension navigateur Chrome (voir
// CLAUDE.md > "Extension navigateur Chrome"). En pratique, un `fetch` émis
// depuis une page de l'extension (popup/background) vers un domaine couvert
// par `host_permissions` du manifest n'est pas soumis au CORS du navigateur
// — mais on renvoie quand même ces en-têtes en repli, ciblés sur l'origine
// `chrome-extension://` précise de la requête (jamais un wildcard `*`,
// incompatible avec `credentials: "include"`), pour rester robuste si ce
// n'était pas le cas ou pour un test manuel depuis une page de test.
export function corsHeadersFor(origin: string | null): Record<string, string> {
  if (!origin || !origin.startsWith("chrome-extension://")) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function corsJson(
  origin: string | null,
  body: unknown,
  init?: { status?: number },
): Response {
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: corsHeadersFor(origin),
  });
}
