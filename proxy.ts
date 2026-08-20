import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Page d'attente en prod avant la bêta publique, voir CLAUDE.md > "Page
// d'attente en production". L'interrupteur lui-même vit en base
// (app_settings.maintenance_mode, migration 0020) plutôt que dans une
// variable d'environnement Vercel — bascule instantanée depuis le bouton du
// dashboard admin (/admin), sans redéploiement. Comme app_settings vit dans
// la base Supabase de chaque environnement (prod et dev sont deux bases
// distinctes, voir CLAUDE.md > "Environnements dev/prod séparés"), basculer
// le mode maintenance en prod n'affecte jamais l'environnement de dev, et
// inversement — sans logique conditionnelle supplémentaire ici.
//
// Contournement : un lien avec ?acces=<jeton> (MAINTENANCE_BYPASS_TOKEN,
// resté une variable d'environnement — c'est un secret, pas un interrupteur)
// pose un cookie qui laisse passer ce navigateur — pratique pour que Thierry
// puisse quand même vérifier la vraie prod sans désactiver la page d'attente
// pour tout le monde.
const COOKIE_ACCES = "kdovie_acces";

async function estEnMaintenance(): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const response = await fetch(
      `${url}/rest/v1/app_settings?select=maintenance_mode&id=eq.1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      },
    );
    if (!response.ok) return false;
    const rows = (await response.json()) as { maintenance_mode: boolean }[];
    return rows[0]?.maintenance_mode === true;
  } catch {
    // Ne jamais bloquer les visiteurs si Supabase est injoignable — on
    // repasse alors sur le comportement "site en ligne", plus sûr qu'une
    // page d'attente qui resterait bloquée par erreur.
    return false;
  }
}

async function reponseMaintenance(request: NextRequest): Promise<NextResponse | null> {
  const { pathname, searchParams } = request.nextUrl;

  // Les routes API (webhooks Stripe, Send Email Hook Supabase...) doivent
  // continuer à répondre normalement même en mode maintenance, ce ne sont
  // pas des visiteurs humains — /bientot-disponible elle-même est exclue
  // pour éviter une boucle de réécriture infinie.
  //
  // /admin, /connexion et /auth/callback sont exclus pour la même raison
  // que /api : ils ont déjà leur propre protection (isCurrentUserAdmin +
  // 404 sur /admin, formulaire d'auth normal sur les deux autres), donc les
  // exclure ne fuite rien. Sans cette exclusion, activer la maintenance
  // enfermerait l'administrateur dehors sans aucun moyen d'y retourner pour
  // la désactiver (bug rencontré en le testant sur l'environnement de dev,
  // où MAINTENANCE_BYPASS_TOKEN n'est délibérément pas posé — voir plus
  // bas) : le bouton /admin ne doit jamais pouvoir se verrouiller lui-même.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/bientot-disponible") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/connexion") ||
    pathname.startsWith("/auth/callback")
  ) {
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
    // Contournement actif pour ce navigateur : inutile d'interroger la base.
    return null;
  }

  if (!(await estEnMaintenance())) {
    return null;
  }

  const urlAttente = request.nextUrl.clone();
  urlAttente.pathname = "/bientot-disponible";
  urlAttente.search = "";
  return NextResponse.rewrite(urlAttente);
}

export async function proxy(request: NextRequest) {
  const maintenance = await reponseMaintenance(request);
  if (maintenance) return maintenance;

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
