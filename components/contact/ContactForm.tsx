"use client";

import { useState, type FormEvent } from "react";
import { sendContactMessage } from "@/app/contact/contact-actions";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

function estEmailValide(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ContactForm() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [piege, setPiege] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "envoi" | "envoye" | "erreur">("idle");
  const [erreur, setErreur] = useState<string | null>(null);

  const emailValide = estEmailValide(email);
  const formValide = nom.trim() !== "" && emailValide && message.trim() !== "";
  const emailError = touched && email !== "" && !emailValide
    ? "Vérifiez votre adresse e-mail, il manque quelque chose."
    : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!formValide) return;

    setStatus("envoi");
    setErreur(null);

    const result = await sendContactMessage(nom, email, message, piege);

    if (result.error) {
      setErreur(result.error);
      setStatus("erreur");
      return;
    }

    setStatus("envoye");
  }

  if (status === "envoye") {
    return (
      <div className="rounded-[26px] bg-[#DCE7DA] px-7 py-8 text-center">
        <div className="mx-auto mb-4.5 h-14 w-14 rounded-2xl bg-sauge" />
        <h2 className="font-heading text-2xl font-bold text-[#2F4A2C]">Message envoyé</h2>
        <p className="mt-2.5 text-base leading-relaxed text-[#3D5A39]">
          Merci, on vous répond dès que possible à <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Honeypot anti-spam : invisible et hors du parcours clavier pour un
          visiteur humain, seul un bot le remplit. */}
      <label className="absolute left-[-9999px]" aria-hidden="true">
        Ne remplissez pas ce champ
        <input
          type="text"
          name="site_web"
          tabIndex={-1}
          autoComplete="off"
          value={piege}
          onChange={(event) => setPiege(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-heading text-base font-bold text-[#4A3529]">Nom</span>
        <input
          type="text"
          required
          autoComplete="name"
          placeholder="Marie Dupont"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          className="w-full rounded-2xl border-2 border-[#F2DFC9] bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-heading text-base font-bold text-[#4A3529]">Adresse e-mail</span>
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
        {emailError && <span className="text-sm text-[#C0512A]">{emailError}</span>}
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-heading text-base font-bold text-[#4A3529]">Message</span>
        <textarea
          required
          rows={6}
          placeholder="Comment pouvons-nous vous aider ?"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full resize-y rounded-2xl border-2 border-[#F2DFC9] bg-white px-4.5 py-4 text-[17px] text-[#4A3529] outline-none focus:ring-2 focus:ring-jaune"
        />
      </label>

      <button
        type="submit"
        disabled={status === "envoi"}
        className="font-heading inline-flex w-full items-center justify-center gap-2.5 rounded-[20px] bg-corail py-[19px] text-lg font-bold text-creme disabled:opacity-60 sm:w-auto sm:px-9"
      >
        {status === "envoi" && <KdovieSpinner className="h-5 w-5" variant="dark" />}
        {status === "envoi" ? "Envoi en cours…" : "Envoyer le message"}
      </button>

      {status === "erreur" && erreur && <p className="text-sm text-[#C0512A]">{erreur}</p>}
    </form>
  );
}
