import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";
import NavAnonyme from "@/components/layout/NavAnonyme";
import NavConnecte from "@/components/layout/NavConnecte";
import PiedDePage from "@/components/layout/PiedDePage";
import PresentationExtension from "@/components/extension/PresentationExtension";

export const metadata: Metadata = pageMetadata({
  title: "L'extension navigateur",
  description:
    "L'extension navigateur Kdovie ajoute un cadeau à votre liste depuis n'importe quel site marchand, " +
    "même ceux qui bloquent la récupération automatique. Chrome — bientôt Edge, Firefox et Safari.",
  path: "/extension",
});

export default async function ExtensionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pseudo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    pseudo = profile?.first_name?.trim() || user.email?.split("@")[0] || null;
  }

  return (
    <div className="flex flex-1 flex-col overflow-x-hidden">
      <div className="flex h-2">
        <span className="flex-[3] bg-corail" />
        <span className="flex-[2] bg-jaune" />
        <span className="flex-[1] bg-sauge" />
      </div>

      <header className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <svg
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="block h-[38px] w-[38px]"
          >
            <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
            <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
            <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
            <path d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z" fill="#8BA888" />
            <path d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z" fill="#8BA888" />
          </svg>
          <span className="font-heading text-2xl font-bold tracking-tight text-corail">
            kdovie
          </span>
        </Link>
        <NavConnecte estConnecte={Boolean(user)} pseudo={pseudo} />
        <NavAnonyme estConnecte={Boolean(user)} />
      </header>

      <main className="flex-1">
        <PresentationExtension />
      </main>

      <PiedDePage />
    </div>
  );
}
