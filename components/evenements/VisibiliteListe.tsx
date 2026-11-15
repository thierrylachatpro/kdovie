"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { updateEventStatus } from "@/app/compte/evenements/[slug]/event-status-actions";
import { sendInvitations } from "@/app/compte/evenements/[slug]/invite-actions";
import type { EventStatus } from "@/lib/event-status";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

function estEmailValide(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function VisibiliteListe({
  eventId,
  slug,
  status,
  eventName,
  lienPublic,
  itemCount = 0,
}: {
  eventId: string;
  slug: string;
  status: EventStatus;
  eventName: string;
  lienPublic: string;
  itemCount?: number;
}) {
  const [value, setValue] = useState(status);
  // Resynchronise l'état local si le serveur renvoie un autre statut après
  // revalidation (setState en phase de rendu, pas dans un effet).
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    setValue(status);
  }
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitees, setInvitees] = useState<string[]>([]);
  const [inviteDraft, setInviteDraft] = useState("");
  const [inviteMessage, setInviteMessage] = useState(
    "Bonjour !\nVoici ma liste de cadeaux. Choisissez ce qui vous fait plaisir (un cadeau, cotiser à une cagnotte). Votre réservation restera une surprise pour moi.\nMerci beaucoup !",
  );
  const [inviteSent, setInviteSent] = useState<number | false>(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Partage en story (voir CLAUDE.md > "Partage d'une liste en story").
  const [storyPending, setStoryPending] = useState(false);
  const [storyMessageAffiche, setStoryMessageAffiche] = useState<string | null>(null);
  const storyFileRef = useRef<File | null>(null);

  // Fenêtre de rappel « liste encore en brouillon ».
  const [rappelOpen, setRappelOpen] = useState(false);
  const [publieConfirmation, setPublieConfirmation] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const rappelRef = useRef<HTMLDivElement | null>(null);
  const cleRappel = `kdovie-rappel-brouillon-${slug}`;

  const shared = value === "ouverte";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=264x264&margin=8&color=4A3529&bgcolor=FFF8F0&data=${encodeURIComponent(lienPublic)}`;

  function changerStatut(next: EventStatus, onSuccess?: () => void) {
    const previous = value;
    setValue(next);
    setErreur(null);
    startTransition(async () => {
      const result = await updateEventStatus(eventId, next, slug);
      if (result.error) {
        setValue(previous);
        setErreur(result.error);
        return;
      }
      onSuccess?.();
    });
  }

  function handleToggle() {
    setPublieConfirmation(false);
    changerStatut(shared ? "brouillon" : "ouverte");
  }

  // Affiche la fenêtre de rappel à l'arrivée sur la page si la liste est en
  // brouillon avec au moins un cadeau, sauf si « Plus tard » a déjà été choisi
  // pendant cette session. Lecture différée (règle set-state-in-effect).
  useEffect(() => {
    if (status !== "brouillon" || itemCount === 0) return;
    const timer = setTimeout(() => {
      let dejaVu = false;
      try {
        dejaVu = window.sessionStorage.getItem(cleRappel) === "1";
      } catch {
        dejaVu = false;
      }
      if (!dejaVu) setRappelOpen(true);
    }, 0);
    return () => clearTimeout(timer);
    // Uniquement à l'arrivée sur la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fermerRappel = useCallback(() => {
    try {
      window.sessionStorage.setItem(cleRappel, "1");
    } catch {
      // stockage indisponible : la fenêtre reviendra simplement plus tard
    }
    setRappelOpen(false);
  }, [cleRappel]);

  function publierDepuisRappel() {
    changerStatut("ouverte", () => {
      setRappelOpen(false);
      setPublieConfirmation(true);
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // Focus piégé + Échap = « Plus tard ».
  useEffect(() => {
    if (!rappelOpen) return;
    const dialog = rappelRef.current;
    const precedent = document.activeElement as HTMLElement | null;
    dialog?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        fermerRappel();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>("button:not([disabled])"),
      );
      if (focusables.length === 0) return;
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === premier) {
        event.preventDefault();
        dernier.focus();
      } else if (!event.shiftKey && document.activeElement === dernier) {
        event.preventDefault();
        premier.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      precedent?.focus?.();
    };
  }, [rappelOpen, fermerRappel]);

  // Prépare le visuel story dès que la liste est ouverte : sur iOS, le menu
  // de partage doit s'ouvrir juste après le clic, sans attendre un
  // téléchargement qui ferait perdre le « geste utilisateur ».
  const urlStory = `/liste/${encodeURIComponent(slug)}/story-image`;
  const nomFichierStory = `kdovie-story-${slug}.png`;
  useEffect(() => {
    if (!shared) return;
    let annule = false;
    fetch(urlStory, { cache: "no-store" })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!annule && blob) {
          storyFileRef.current = new File([blob], nomFichierStory, { type: "image/png" });
        }
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [shared, urlStory, nomFichierStory]);

  function telechargerStory(file: File) {
    const objectUrl = URL.createObjectURL(file);
    const lien = document.createElement("a");
    lien.href = objectUrl;
    lien.download = nomFichierStory;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function handleStory() {
    if (!shared || storyPending) return;
    setStoryMessageAffiche(null);
    // Uniquement l'URL : le sticker Lien d'Instagram n'accepte qu'une adresse.
    navigator.clipboard?.writeText(lienPublic).catch(() => {});

    let file = storyFileRef.current;
    if (!file) {
      setStoryPending(true);
      try {
        const res = await fetch(urlStory, { cache: "no-store" });
        if (res.ok) {
          file = new File([await res.blob()], nomFichierStory, { type: "image/png" });
          storyFileRef.current = file;
        }
      } catch {
        file = null;
      }
      setStoryPending(false);
    }
    if (!file) {
      setStoryMessageAffiche("Impossible de préparer le visuel pour l'instant, réessaie dans un instant.");
      return;
    }

    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        setStoryMessageAffiche(
          "Ta story est prête ! Le lien est copié : colle-le dans un sticker Lien, sur la flèche, pour que tes proches arrivent directement sur ta liste.",
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        telechargerStory(file);
        setStoryMessageAffiche(
          "Ton visuel est téléchargé et le lien est copié. Envoie l'image sur ton téléphone pour la publier en story, puis colle le lien dans un sticker Lien sur la flèche.",
        );
      }
      return;
    }

    telechargerStory(file);
    setStoryMessageAffiche(
      "Ton visuel est téléchargé et le lien est copié. Envoie l'image sur ton téléphone pour la publier en story, puis colle le lien dans un sticker Lien sur la flèche.",
    );
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

  async function handleSendInvites() {
    if (invitees.length === 0) return;
    setIsSending(true);
    setSendError(null);
    const count = invitees.length;
    const result = await sendInvitations(invitees, eventName, inviteMessage, lienPublic);
    setIsSending(false);
    if (result.error) {
      setSendError(result.error);
      return;
    }
    setInviteSent(count);
    setInvitees([]);
  }

  return (
    <section
      ref={sectionRef}
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
            {shared ? "Vos proches peuvent voir cette liste" : "Vous seul voyez cette liste"}
          </span>
        </div>
        <p className="mb-3 max-w-115 text-[15px] leading-relaxed text-[#7A6354]">
          {shared
            ? "Toute personne à qui vous donnez le lien peut consulter les cadeaux et en réserver."
            : "Personne d'autre que vous n'y a accès, même avec le lien. Ouvrez-la quand vous serez prêt à recevoir des réservations."}
        </p>
        <div className="flex flex-nowrap items-center gap-2.5">
          <span
            className={`min-w-0 truncate text-sm ${shared ? "text-[#8A7263]" : "text-[#A08D7E]"}`}
          >
            {lienPublic}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!shared}
            className={`flex-none text-sm font-semibold underline ${
              shared ? "cursor-pointer text-[#C0512A]" : "cursor-default text-[#A08D7E]"
            }`}
          >
            {shared ? (copie ? "Lien copié !" : "Copier le lien") : "Lien inactif"}
          </button>
        </div>
        {erreur && <p className="mt-2.5 text-sm text-corail-dark">{erreur}</p>}
        {publieConfirmation && shared && (
          <p
            role="status"
            className="mt-3 inline-block rounded-full bg-white/70 px-4 py-2 text-[15px] font-semibold text-[#2F4A2C]"
          >
            Ta liste est en ligne ! Partage-la maintenant avec tes proches.
          </p>
        )}
        {storyMessageAffiche && (
          <p role="status" className="mt-3 max-w-115 text-[15px] leading-relaxed text-[#2F4A2C]">
            {storyMessageAffiche}
          </p>
        )}
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
          onClick={handleStory}
          disabled={!shared || storyPending}
          title={shared ? undefined : "Ouvrez d'abord votre liste aux invités"}
          className={`font-heading inline-flex items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-[15px] font-bold ${
            shared
              ? "cursor-pointer bg-jaune text-[#6B4A0F] hover:bg-[#EBAB2C] disabled:opacity-60"
              : "cursor-default bg-[#F2DFC9] text-[#A08D7E]"
          }`}
        >
          {storyPending ? (
            <KdovieSpinner className="h-4 w-4" />
          ) : (
            <span className="text-lg" aria-hidden="true">📱</span>
          )}
          Partager en story
        </button>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className={`font-heading inline-flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-[15px] font-bold disabled:opacity-60 ${
            shared
              ? "bg-creme text-[#5C4436] hover:bg-white"
              : "rounded-[20px] bg-corail px-6 py-4.5 text-[17px] text-creme hover:bg-[#D45F37]"
          }`}
        >
          {isPending && (
            <KdovieSpinner className="h-4 w-4" variant={shared ? "light" : "dark"} />
          )}
          {!isPending && (shared ? "Fermer la liste" : "Ouvrir ma liste aux invités")}
        </button>
      </div>

      {rappelOpen && !shared && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#4A3529]/45 sm:items-center sm:p-6"
          onClick={fermerRappel}
        >
          <div
            ref={rappelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rappel-brouillon-titre"
            aria-describedby="rappel-brouillon-texte"
            className="w-full max-w-120 rounded-t-[28px] bg-creme p-6.5 sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#F7E7D6] text-3xl">
              <span aria-hidden="true">🙈</span>
            </div>
            <h2
              id="rappel-brouillon-titre"
              className="font-heading mb-2 text-2xl font-bold text-[#4A3529]"
            >
              Ta liste est encore en brouillon
            </h2>
            <p id="rappel-brouillon-texte" className="mb-5 text-[16px] leading-relaxed text-[#7A6354]">
              Tes invités ne peuvent pas encore la voir. Tu veux la publier maintenant ?
            </p>
            {erreur && <p className="mb-3 text-sm text-corail-dark">{erreur}</p>}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                data-autofocus
                onClick={publierDepuisRappel}
                disabled={isPending}
                className="font-heading inline-flex items-center justify-center gap-2.5 rounded-[18px] bg-corail px-6 py-4 text-base font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
              >
                {isPending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
                Publier ma liste
              </button>
              <button
                type="button"
                onClick={fermerRappel}
                disabled={isPending}
                className="font-heading rounded-[18px] bg-white px-6 py-4 text-base font-bold text-[#5C4436] hover:bg-[#F7E7D6] disabled:opacity-60"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && shared && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-[#4A3529]/45 p-6"
          onClick={() => {
            setInviteOpen(false);
            setInviteSent(false);
          }}
        >
          <div
            className="w-full max-w-155 rounded-[28px] bg-creme p-6.5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3.5 flex items-start justify-between gap-4">
              <h2 className="font-heading text-xl font-bold text-[#4A3529]">
                À qui envoyer la liste ?
              </h2>
              <button
                type="button"
                onClick={() => {
                  setInviteOpen(false);
                  setInviteSent(false);
                }}
                className="p-1 text-[15px] font-semibold text-[#8A7263]"
              >
                Fermer
              </button>
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
              rows={5}
              placeholder="Un petit mot pour accompagner l'invitation (facultatif)"
              className="mb-4 w-full resize-y rounded-2xl border-2 border-[#F2DFC9] bg-white px-4 py-3.5 text-base text-[#4A3529] outline-none focus:border-corail"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSendInvites}
                disabled={invitees.length === 0 || isSending}
                className={`font-heading inline-flex items-center gap-2.5 rounded-[18px] px-6 py-4 text-base font-bold disabled:opacity-60 ${
                  invitees.length > 0
                    ? "cursor-pointer bg-corail text-creme hover:bg-[#D45F37]"
                    : "cursor-default bg-[#F2DFC9] text-[#A08D7E]"
                }`}
              >
                {isSending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
                {isSending
                  ? "Envoi en cours…"
                  : invitees.length > 0
                    ? `Envoyer à ${invitees.length} ${invitees.length > 1 ? "personnes" : "personne"}`
                    : "Envoyer l'invitation"}
              </button>
              {inviteSent !== false && (
                <span className="rounded-full bg-[#DCE7DA] px-4 py-2.5 text-[15px] font-semibold text-[#2F4A2C]">
                  Invitation envoyée à {inviteSent} {inviteSent > 1 ? "personnes" : "personne"}
                </span>
              )}
            </div>
            {sendError && <p className="mt-2.5 text-sm text-corail-dark">{sendError}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

