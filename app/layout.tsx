import type { Metadata } from "next";
import { Quicksand, Work_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import BandeauEnvironnement from "@/components/layout/BandeauEnvironnement";
import "./globals.css";

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
        {/* Barre de progression pendant la navigation côté client — voir
            CLAUDE.md > "Barre de progression globale pendant la navigation".
            Un seul point d'intégration, s'applique automatiquement à toute
            l'app, rien à poser lien par lien. */}
        <NextTopLoader color="#E8734A" showSpinner={false} shadow={false} height={3} />
        <BandeauEnvironnement />
        {children}
      </body>
    </html>
  );
}
