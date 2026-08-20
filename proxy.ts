import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Page d'attente en prod avant la bêta publique, voir CLAUDE.md > "Page
// d'attente en production". Activée uniquement via MAINTENANCE_MODE=true,
// une variable posée sur Vercel dans le scope "Production" uniquement —
// jamais sur Preview, donc l'environnement de dev (kdovie-git-dev-...)
// n'est jamais concerné, même sans logique conditionnelle ici.
//
// Contournement : un lien avec ?acces=<jeton> (MAINTENANCE_BYPASS_TOKEN) pose
// un cookie qui laisse passer ce navigateur — pratique pour que Thierry
// puisse quand même vérifier la vraie prod sans désactiver la page d'attente
// pour tout le monde.
const COOKIE_ACCES = "kdovie_acces";

function reponseMaintenance(request: NextRequest): NextResponse | null {
  if (process.env.MAINTENANCE_MODE !== "true") {
    return null;
  }

  const { pathname, searchParams } = request.nextUrl;

  // Les routes API (webhooks Stripe, Send Email Hook Supabase...) doivent
  // continuer à répondre normalement même en mode maintenance, ce ne sont
  // pas des visiteurs humains — /bientot-disponible elle-même est exclue
  // pour éviter une boucle de réécriture infinie.
  if (pathname.startsWith("/api") || pathname.startsWith("/bientot-disponible")) {
    return null;
  }

  const bypassToken = process.env.MAINTENANCE_BYPASS_TOKEN;

  const tokenFourni = searchParams.get("acces");
  if (bypassToken && tokenFourni === bypassToken) {
    const urlNettoyee = request.nextUrl.clone();
    urlNettoyee.searchParams.delete("acces");
    const response = NextResponse.redirect(urlNettoyee);
    response.cookies.set(COOKIE_ACCES, bypassToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 jours
      path: "/",
    });
    return response;
  }

  const cookieAcces = request.cookies.get(COOKIE_ACCES)?.value;
  if (bypassToken && cookieAcces === bypassToken) {
    return null;
  }

  const urlAttente = request.nextUrl.clone();
  urlAttente.pathname = "/bientot-disponible";
  urlAttente.search = "";
  return NextResponse.rewrite(urlAttente);
}

export async function proxy(request: NextRequest) {
  const maintenance = reponseMaintenance(request);
  if (maintenance) return maintenance;

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
