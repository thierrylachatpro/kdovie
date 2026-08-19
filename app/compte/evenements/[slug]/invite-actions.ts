"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/send-email";
import InvitationEmail from "@/components/emails/InvitationEmail";

// Un email par destinataire, jamais un envoi groupé — exposerait les
// adresses des uns aux autres, voir CLAUDE.md > "Emails transactionnels".
// Remplace l'état "Invitation envoyée" purement optimiste de
// VisibiliteListe par un vrai envoi.
export async function sendInvitations(
  emails: string[],
  eventName: string,
  message: string,
  lienListe: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  if (emails.length === 0) {
    return { error: "Ajoutez au moins un destinataire." };
  }

  // Pseudo de l'organisateur dans l'objet, quand renseigné — cohérent avec
  // le pseudo public déjà affiché sur /liste/[slug], voir CLAUDE.md >
  // "Pseudo public sur la page liste". Pas de fallback sur l'email (même
  // règle que côté page publique : rien à faire fuiter si le pseudo est vide).
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const organizerName = profile?.display_name?.trim() || null;
  const subject = organizerName
    ? `${organizerName} vous envoie sa liste de cadeaux`
    : "On vous envoie une liste de cadeaux";

  await Promise.all(
    emails.map((email) =>
      sendTransactionalEmail({
        to: email,
        subject,
        react: InvitationEmail({ eventName, message, lienListe }),
      }),
    ),
  );

  return { error: null };
}
