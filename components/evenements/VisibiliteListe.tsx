"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { updateEventStatus } from "@/app/compte/evenements/[slug]/event-status-actions";
import type { EventStatus } from "@/lib/event-status";

function estEmailValide(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function VisibiliteListe({
  eventId,
  slug,
  status,
  eventName,
  lienPublic,
}: {
  eventId: string;
  slug: string;
  status: EventStatus;
  eventName: string;
  lienPublic: string;
}) {
  const [value, setValue] = useState(status);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [inviteDraft, setInviteDraft] = useState("");
  const [inviteMessage, setInviteMessage] = useState(
    `Bonjour, voici ma liste de cadeaux pour ${eventName}. Choisissez ce qui vous fait plaisir, votre réservation reste une surprise. Merci beaucoup !`,
  );
  const [inviteSent, setInviteSent] = useState<number | false>(false);

  const shared = value === "ouverte";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=264x264&margin=8&color=4A3529&bgcolor=FFF8F0&data=${encodeURIComponent(lienPublic)}`;

  function handleToggle() {
    const next: EventStatus = shared ? "brouillon" : "ouverte";
    const previous = value;
    setValue(next);
    setErreur(null);
    startTransition(async () => {
      const result = await updateEventStatus(eventId, next, slug);
      if (result.error) {
        setValue(previous);
        setErreur(result.error);
      }
    });
  }

  async function handleCopy() {
    if (!shared) return;
    await navigator.clipboard.writeText(lienPublic);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  function handleAddInvitee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = inviteDraft.trim();
    if (!estEmailValide(email) || invitees.includes(email)) return;
    setInvitees((current) => [...current, email]);
    setInviteDraft("");
    setInviteSent(false);
  }

  function removeInvitee(email: string) {
    setInvitees((current) => current.filter((e) => e !== email));
    setInviteSent(false);
  }

  function handleSendInvites() {
    if (invitees.length === 0) return;
    // Envoi non câblé pour l'instant : aucun e-mail n'est réellement expédié
    // (pas d'intégration Resend en place), voir CLAUDE.md.
    setInviteSent(invitees.length);
    setInvitees([]);
  }

  return (
    <section
      className={`mb-7 flex flex-wrap items-center gap-6 rounded-[28px] p-6.5 ${
        shared ? "bg-[#DCE7DA]" : "bg-[#F7E7D6]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt="QR code vers la liste"
        width={132}
        height={132}
        className={`block flex-none rounded-[20px] bg-creme p-2 ${shared ? "" : "opacity-45"}`}
      />
      <div className="min-w-70 flex-1">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span
            className={`block h-3.5 w-3.5 flex-none rounded-[5px] ${shared ? "bg-sauge" : "bg-jaune"}`}
          />
          <span className="font-heading text-xl font-bold text-[#4A3529]">
            {shared ? "Vos invités peuvent voir cette liste" : "Vous seul voyez cette liste"}
          </span>
        </div>
        <p className="mb-3 max-w-115 text-[15px] leading-relaxed text-[#7A6354]">
          {shared
            ? "Toute personne à qui vous donnez le lien peut consulter les cadeaux et en réserver. Rien n'apparaît dans les moteurs de recherche."
            : "Personne d'autre que vous n'y a accès, même avec le lien. Ouvrez-la quand vous serez prêt à recevoir des réservations."}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`text-sm ${shared ? "text-[#8A7263]" : "text-[#A08D7E]"}`}>
            {lienPublic}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!shared}
            className={`text-sm font-semibold underline ${
              shared ? "cursor-pointer text-[#C0512A]" : "cursor-default text-[#A08D7E]"
            }`}
          >
            {shared ? (copie ? "Lien copié !" : "Copier le lien") : "Lien inactif"}
          </button>
        </div>
        {erreur && <p className="mt-2.5 text-sm text-corail-dark">{erreur}</p>}
      </div>

      <div className="flex min-w-58 flex-col items-stretch gap-2.5">
        {shared && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="font-heading inline-flex items-center justify-center gap-2.5 rounded-[20px] bg-corail px-6 py-4.5 text-[17px] font-bold text-creme hover:bg-[#D45F37]"
          >
            <span className="text-lg">✉️</span>Inviter mes proches
          </button>
        )}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`font-heading w-full rounded-2xl px-5 py-3.5 text-[15px] font-bold disabled:opacity-60 ${
            shared
              ? "bg-creme text-[#5C4436] hover:bg-white"
              : "rounded-[20px] bg-corail px-6 py-4.5 text-[17px] text-creme hover:bg-[#D45F37]"
          }`}
        >
          {isPending ? "…" : shared ? "Refermer la liste" : "Ouvrir ma liste aux invités"}
        </button>
      </div>

      {inviteOpen && shared && (
        <div className="w-full max-w-155 rounded-[22px] bg-creme p-5.5">
          <div className="font-heading mb-3.5 text-lg font-bold text-[#4A3529]">
            À qui envoyer la liste ?
          </div>

          {invitees.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {invitees.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-2.5 rounded-full bg-[#F7E7D6] py-2 pr-2.5 pl-3.5 text-[15px] text-[#5C4436]"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeInvitee(email)}
                    className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-[#F2DFC9] text-sm leading-none text-[#7A6354]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <form onSubmit={handleAddInvitee} className="mb-3.5 flex flex-wrap gap-2.5">
            <input
              type="email"
              value={inviteDraft}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setInviteDraft(event.target.value)
              }
              placeholder="prenom@email.fr"
              className="min-w-55 flex-1 rounded-2xl border-2 border-[#F2DFC9] bg-white px-4 py-3.5 text-base text-[#4A3529] outline-none focus:border-corail"
            />
            <button
              type="submit"
              className="font-heading rounded-2xl bg-jaune px-5 py-3.5 text-[15px] font-bold text-[#6B4A0F] hover:bg-[#EBAB2C]"
            >
              Ajouter
            </button>
          </form>

          <textarea
            value={inviteMessage}
            onChange={(event) => setInviteMessage(event.target.value)}
            rows={2}
            placeholder="Un petit mot pour accompagner l'invitation (facultatif)"
            className="mb-4 w-full resize-y rounded-2xl border-2 border-[#F2DFC9] bg-white px-4 py-3.5 text-base text-[#4A3529] outline-none focus:border-corail"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSendInvites}
              disabled={invitees.length === 0}
              className={`font-heading rounded-[18px] px-6 py-4 text-base font-bold ${
                invitees.length > 0
                  ? "cursor-pointer bg-corail text-creme hover:bg-[#D45F37]"
                  : "cursor-default bg-[#F2DFC9] text-[#A08D7E]"
              }`}
            >
              {invitees.length > 0
                ? `Envoyer à ${invitees.length} ${invitees.length > 1 ? "personnes" : "personne"}`
                : "Envoyer l'invitation"}
            </button>
            <button
              type="button"
              onClick={() => {
                setInviteOpen(false);
                setInviteSent(false);
              }}
              className="px-2.5 py-4 text-[15px] font-semibold text-[#8A7263]"
            >
              Fermer
            </button>
            {inviteSent !== false && (
              <span className="rounded-full bg-[#DCE7DA] px-4 py-2.5 text-[15px] font-semibold text-[#2F4A2C]">
                Invitation envoyée à {inviteSent} {inviteSent > 1 ? "personnes" : "personne"}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

