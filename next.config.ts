import type { NextConfig } from "next";

// En-têtes de sécurité de base (voir CLAUDE.md > "Fondations SEO", point M1).
// Volontairement conservateur : pas de Content-Security-Policy ici (elle
// casserait GTM / Stripe / Supabase / next-font sans un vrai travail de
// calibration), pas de Permissions-Policy (risque d'interférence avec l'iframe
// d'onboarding Stripe qui peut demander la caméra pour la vérification
// d'identité). À compléter plus tard, en testant contre le flux Stripe réel.
const securityHeaders = [
  // Vercel pose déjà un HSTS par défaut sur le domaine custom ; on le rend
  // explicite + includeSubDomains. Pas de `preload` (engagement fort à ne
  // prendre qu'en le soumettant volontairement à la liste HSTS preload).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
