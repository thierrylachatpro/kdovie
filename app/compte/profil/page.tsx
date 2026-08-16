import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeconnexionButton from "@/components/auth/DeconnexionButton";
import { updateDisplayName } from "./actions";

export default async function ProfilPage({
  searchParams,
}: PageProps<"/compte/profil">) {
  const sp = await searchParams;
  const succes = sp.succes === "1";
  const erreur = sp.erreur === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-16">
      <Link href="/compte" className="self-start text-sm text-gris">
        ← Retour au tableau de bord
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold text-corail">Mon compte</h1>
        <p className="mt-1 text-sm text-gris">Gérez votre profil organisateur.</p>
      </div>

      <form
        action={updateDisplayName}
        className="flex flex-col gap-5 rounded-xl border border-gris/20 bg-white p-6"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          Email
          <span className="rounded-lg border border-gris/20 bg-creme px-4 py-2.5 text-sm text-gris">
            {user.email}
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          Pseudo
          <input
            type="text"
            name="display_name"
            defaultValue={profile?.display_name ?? ""}
            placeholder="Comment on vous appelle"
            className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-corail"
          />
        </label>

        {succes && <p className="text-sm text-sauge-dark">Pseudo enregistré.</p>}
        {erreur && (
          <p className="text-sm text-corail-dark">Une erreur est survenue, réessayez.</p>
        )}

        <button
          type="submit"
          className="rounded-lg bg-jaune px-5 py-2.5 text-sm font-medium text-corail-dark"
        >
          Enregistrer
        </button>
      </form>

      <DeconnexionButton />
    </main>
  );
}
