"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeconnexionButton({
  className = "rounded-lg border border-corail px-5 py-2.5 text-sm font-medium text-corail",
}: {
  className?: string;
}) {
  const router = useRouter();

  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button onClick={handleClick} className={className}>
      Se déconnecter
    </button>
  );
}
