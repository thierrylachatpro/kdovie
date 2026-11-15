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
import { updateShortAlias } from "@/app/compte/evenements/[slug]/alias-actions";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  aliasVariants,
  isValidAlias,
  normalizeAlias,
  normalizeAliasSaisie,
} from "@/lib/short-alias";

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
  shortAlias = null,
  aliasVerrouille = false,
  anneeAlias,
}: {
  eventId: string;
  slug: string;
  status: EventStatus;
  eventName: string;
  lienPublic: string;
  itemCount?: number;
  shortAlias?: string | null;
  aliasVerrouille?: boolean;
  anneeAlias?: number;
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

  // Lien court /kdo/{alias} : modifiable tant que la liste n'a jamais été
  // ouverte (voir CLAUDE.md > "Liens courts mémorisables").
  const [aliasEdition, setAliasEdition] = useState(false);
  const [aliasDraft, setAliasDraft] = useState(shortAlias ?? "");
  const [aliasEtat, setAliasEtat] = useState<
    "idle" | "verification" | "libre" | "pris" | "invalide" | "actuel"
  >("idle");
  const [aliasSuggestions, setAliasSuggestions] = useState<string[]>([]);
  const [aliasErreur, setAliasErreur] = useState<string | null>(null);
  const [aliasSaving, startAliasSaving] = useTransition();

  const shared = value === "ouverte";
  // Ouvrir la liste verrouille le lien (trigger en base) : on le considère
  // verrouillé dès l'ouverture côté interface, sans attendre la revalidation.
  const aliasModifiable = !aliasVerrouille && !shared;
  const lienAffiche = lienPublic.replace(/^https?:\/\//, "");
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
    // Annoncé tout de suite : sur mobile, ce message est visible dès la
    // fermeture du menu de partage.
    setStoryMessageAffiche(`Lien copié : ${lienAffiche}`);

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
      setStoryMessageAffiche("Le lien de votre liste est copié, mais le visuel n'a pas pu être préparé. Réessayez dans un instant.");
      return;
    }

    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        setStoryMessageAffiche(
          `C'est prêt ! Le lien de votre liste (${lienAffiche}) est copié : collez-le dans un sticker Lien de votre story ou dans votre message.`,
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        telechargerStory(file);
        setStoryMessageAffiche(
          `Le visuel est téléchargé et le lien de votre liste (${lienAffiche}) est copié. Envoyez l'image sur votre téléphone pour la partager en story ou en message sur Instagram ou TikTok, puis collez-y le lien.`,
        );
      }
      return;
    }

    telechargerStory(file);
    setStoryMessageAffiche(
      `Le visuel est téléchargé et le lien de votre liste (${lienAffiche}) est copié. Envoyez l'image sur votre téléphone pour la partager en story ou en message sur Instagram ou TikTok, puis collez-y le lien.`,
    );
  }

  // Vérification de disponibilité, ~400 ms après la dernière frappe.
  useEffect(() => {
    if (!aliasEdition) return;
    const alias = normalizeAlias(aliasDraft);
    const timer = setTimeout(async () => {
      if (!isValidAlias(alias)) {
        setAliasEtat("invalide");
        setAliasSuggestions([]);
        return;
      }
      if (alias === shortAlias) {
        setAliasEtat("actuel");
        setAliasSuggestions([]);
        return;
      }
      setAliasEtat("verification");
      const supabase = createBrowserClient();
      const estLibre = async (candidat: string) => {
        const { data, error } = await supabase.rpc("is_short_alias_available", {
          p_alias: candidat,
        });
        return !error && data === true;
      };
      if (await estLibre(alias)) {
        setAliasEtat("libre");
        setAliasSuggestions([]);
        return;
      }
      setAliasEtat("pris");
      const libres: string[] = [];
      for (const candidat of aliasVariants(alias, anneeAlias ?? new Date().getFullYear(), 6)) {
        if (libres.length >= 3) break;
        if (await estLibre(candidat)) libres.push(candidat);
      }
      setAliasSuggestions(libres);
    }, 400);
    return () => clearTimeout(timer);
  }, [aliasDraft, aliasEdition, shortAlias, anneeAlias]);

  function ouvrirEditionAlias() {
    setAliasDraft(shortAlias ?? "");
    setAliasErreur(null);
    setAliasEtat("idle");
    setAliasSuggestions([]);
    setAliasEdition(true);
  }

  function enregistrerAlias() {
    const alias = normalizeAlias(aliasDraft);
    if (!isValidAlias(alias) || aliasEtat === "pris") return;
    setAliasErreur(null);
    startAliasSaving(async () => {
      const result = await updateShortAlias(eventId, alias, slug);
      if (result.error) {
        setAliasErreur(result.error);
        return;
      }
      setAliasEdition(false);
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
        {aliasEdition ? (
          <div className="flex max-w-115 flex-col gap-2">
            <div className="flex items-center overflow-hidden rounded-2xl border-2 border-[#F2DFC9] bg-white focus-within:border-corail">
              <span className="flex-none pl-3.5 text-sm text-[#8A7263]">kdovie.com/kdo/</span>
              <input
                type="text"
                value={aliasDraft}
                autoFocus
                aria-label="Fin du lien court"
                maxLength={40}
                onChange={(event) => {
                  setAliasDraft(normalizeAliasSaisie(event.target.value));
                  setAliasErreur(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    enregistrerAlias();
                  } else if (event.key === "Escape") {
                    setAliasEdition(false);
                  }
                }}
                className="min-w-0 flex-1 bg-transparent py-2.5 pr-3.5 text-sm text-[#4A3529] outline-none"
              />
            </div>
            <p aria-live="polite" className="text-sm">
              {aliasEtat === "verification" && (
                <span className="text-[#8A7263]">Vérification…</span>
              )}
              {aliasEtat === "libre" && <span className="font-semibold text-[#5E7E5B]">Disponible</span>}
              {aliasEtat === "actuel" && (
                <span className="text-[#8A7263]">C&apos;est votre lien actuel.</span>
              )}
              {aliasEtat === "invalide" && (
                <span className="text-[#8A7263]">
                  Entre 3 et 40 caractères : lettres, chiffres et tirets.
                </span>
              )}
              {aliasEtat === "pris" && (
                <span className="font-semibold text-corail-dark">Déjà utilisé</span>
              )}
            </p>
            {aliasEtat === "pris" && aliasSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-[#8A7263]">Libres :</span>
                {aliasSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setAliasDraft(suggestion)}
                    className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#5C4436] hover:bg-[#F7E7D6]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {aliasErreur && <p className="text-sm text-corail-dark">{aliasErreur}</p>}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={enregistrerAlias}
                disabled={
                  aliasSaving || !(aliasEtat === "libre" || aliasEtat === "actuel")
                }
                className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-4.5 py-2.5 text-sm font-bold text-creme hover:bg-[#D45F37] disabled:opacity-50"
              >
                {aliasSaving && <KdovieSpinner className="h-4 w-4" variant="dark" />}
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setAliasEdition(false)}
                disabled={aliasSaving}
                className="font-heading rounded-2xl bg-white px-4.5 py-2.5 text-sm font-bold text-[#5C4436] hover:bg-[#F7E7D6]"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span
                className={`min-w-0 truncate text-sm ${shared ? "text-[#8A7263]" : "text-[#A08D7E]"}`}
              >
                {lienAffiche}
              </span>
              {aliasModifiable && (
                <button
                  type="button"
                  onClick={ouvrirEditionAlias}
                  aria-label="Modifier le lien court"
                  className="flex-none cursor-pointer text-sm font-semibold text-[#C0512A] underline"
                >
                  Modifier
                </button>
              )}
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
            {shortAlias && aliasModifiable && (
              <p className="mt-1 text-[13px] text-[#8A7263]">
                Vous pouvez encore le personnaliser : il deviendra définitif dès que votre liste
                sera ouverte.
              </p>
            )}
          </>
        )}
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
          Partager en story ou en message
        </button>
        {shared && (
          <p className="-mt-1 px-2 text-center text-[13px] leading-snug text-[#7A6354]">
            Instagram ou TikTok. Le lien de votre liste est copié en même temps, prêt à coller.
          </p>
        )}
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

