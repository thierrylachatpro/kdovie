"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

function estEmailValide(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ConnexionForm({
  next,
  lienInvalide,
  compteDesactive,
}: {
  next: string;
  lienInvalide: boolean;
  compteDesactive?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "envoi" | "envoye" | "erreur">(
    "idle",
  );
  const [erreurServeur, setErreurServeur] = useState<string | null>(null);

  const emailValide = estEmailValide(email);
  const emailError =
    touched && !emailValide
      ? "Vérifiez votre adresse e-mail, il manque quelque chose."
      : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!emailValide) return;

    setStatus("envoi");
    setErreurServeur(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setErreurServeur(error.message);
      setStatus("erreur");
      return;
    }

    setStatus("envoye");
  }

  if (status === "envoye") {
    return (
      <div className="rounded-[26px] bg-[#DCE7DA] px-7 py-8 text-center">
        <div className="mx-auto mb-4.5 h-14 w-14 rounded-2xl bg-sauge" />
        <h2 className="font-heading text-2xl font-bold text-[#2F4A2C]">
          Regardez vos e-mails
        </h2>
        <p className="mt-2.5 mb-5.5 text-base leading-relaxed text-[#3D5A39]">
          Nous venons d&apos;envoyer un lien à <strong>{email}</strong>. Il
          reste valable une heure.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setTouched(false);
          }}
          className="font-heading rounded-2xl bg-creme px-6 py-3.5 text-base font-bold text-[#2F4A2C]"
        >
          Revenir en arrière
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {lienInvalide && (
        <p className="rounded-2xl bg-[#F7E7D6] px-4.5 py-3.5 text-sm text-[#C0512A]">
          Ce lien de connexion n&apos;est plus valable, demandez-en un
          nouveau.
        </p>
      )}
      {compteDesactive && (
        <p className="rounded-2xl bg-[#F7E7D6] px-4.5 py-3.5 text-sm text-[#C0512A]">
          Ce compte a été désactivé, contactez-nous à contact@kdovie.com si
          vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
        </p>
      )}

      <label className="flex flex-col gap-2">
        <span className="font-heading text-base font-bold text-[#4A3529]">
          Adresse e-mail
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="marie.dupont@email.fr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`w-full rounded-2xl border-2 bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune ${
            emailError ? "border-corail" : "border-[#F2DFC9]"
          }`}
        />
        {emailError && (
          <span className="text-sm text-[#C0512A]">{emailError}</span>
        )}
      </label>

      <p className="m-0 rounded-[18px] bg-[#F7E7D6] px-4.5 py-4 text-base leading-relaxed text-[#7A6354]">
        Un clic dans l&apos;e-mail et vous êtes connecté. Si vous n&apos;avez
        pas encore de compte, il se crée au premier lien.
      </p>

      <button
        type="submit"
        disabled={status === "envoi"}
        className="font-heading inline-flex w-full items-center justify-center gap-2.5 rounded-[20px] bg-corail py-[19px] text-lg font-bold text-creme disabled:opacity-60"
      >
        {status === "envoi" && <KdovieSpinner className="h-5 w-5" variant="dark" />}
        {status === "envoi" ? "Envoi en cours…" : "Recevoir mon lien"}
      </button>

      {status === "erreur" && erreurServeur && (
        <p className="text-sm text-[#C0512A]">{erreurServeur}</p>
      )}
    </form>
  );
}
