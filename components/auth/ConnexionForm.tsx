"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "envoi" | "envoye" | "erreur">(
    "idle",
  );
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("envoi");
    setErreur(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setErreur(error.message);
      setStatus("erreur");
      return;
    }

    setStatus("envoye");
  }

  if (status === "envoye") {
    return (
      <p className="max-w-sm text-sm text-gris">
        Un lien de connexion vient d&apos;être envoyé à <strong>{email}</strong>.
        Ouvrez-le depuis votre boîte mail pour vous connecter.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <input
        type="email"
        required
        autoComplete="email"
        placeholder="vous@exemple.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="rounded-lg border border-gris/30 bg-white px-4 py-2.5 text-sm text-foreground outline-none focus:border-corail"
      />
      <button
        type="submit"
        disabled={status === "envoi"}
        className="rounded-lg bg-jaune px-5 py-2.5 text-sm font-medium text-corail-dark disabled:opacity-60"
      >
        {status === "envoi" ? "Envoi en cours…" : "Recevoir le lien de connexion"}
      </button>
      {status === "erreur" && (
        <p className="text-sm text-corail-dark">{erreur}</p>
      )}
    </form>
  );
}
