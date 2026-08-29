import type { Metadata } from "next";
import Script from "next/script";
import { Quicksand, Work_Sans } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import BandeauCookies from "@/components/ui/BandeauCookies";
import BandeauEnvironnement from "@/components/layout/BandeauEnvironnement";
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
  title: "Kdovie",
  description: "La liste de cadeaux qui suit vos événements",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${quicksand.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-creme text-foreground">
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
