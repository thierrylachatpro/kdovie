import type { Metadata } from "next";
import Script from "next/script";
import { Quicksand, Work_Sans } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import BandeauCookies from "@/components/ui/BandeauCookies";
import BandeauEnvironnement from "@/components/layout/BandeauEnvironnement";
import { SITE_URL } from "@/lib/site-url";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME } from "@/lib/seo";
import "./globals.css";

// Google Tag Manager — voir CLAUDE.md > "Google Analytics 4, bandeau de
// consentement et Search Console". Scope Vercel Production uniquement :
// absente en dev/preview, rien ne se charge, aucune erreur (même principe
// de repli silencieux que les autres clés du projet).
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
    url: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

// Données structurées d'entité — reprises des mentions légales
// (Prowebia SASU, SIREN 992 497 891). Organization + WebSite, injectées une
// seule fois sur tout le site. Pas de SearchAction : /recherche cherche des
// personnes, pas le contenu du site — un sitelinks searchbox y renverrait à tort.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: "Prowebia",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-email.png`,
      email: "contact@kdovie.com",
      description: DEFAULT_DESCRIPTION,
      vatID: "FR18992497891",
      taxID: "992497891",
      address: {
        "@type": "PostalAddress",
        streetAddress: "15 Rue du Bois",
        postalCode: "80540",
        addressLocality: "Clairy-Saulchoix",
        addressCountry: "FR",
      },
      founder: { "@type": "Person", name: "Thierry Lachat" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "fr-FR",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${quicksand.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-creme text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {GTM_ID && (
          <>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
            {/* Consent Mode : état par défaut refusé, posé avant le
                conteneur GTM lui-même — GTM lit le même window.dataLayer,
                aucune dépendance à gtag.js chargé séparément. */}
            <Script id="consent-mode-defaut" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){ dataLayer.push(arguments); }
                gtag('consent', 'default', { analytics_storage: 'denied' });
              `}
            </Script>
            <GoogleTagManager gtmId={GTM_ID} />
          </>
        )}
        <BandeauEnvironnement />
        {children}
        <BandeauCookies />
      </body>
    </html>
  );
}
