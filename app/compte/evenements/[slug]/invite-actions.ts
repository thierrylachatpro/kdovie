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

  await Promise.all(
    emails.map((email) =>
      sendTransactionalEmail({
        to: email,
        subject: `${eventName} — une liste de cadeaux pour vous`,
        react: InvitationEmail({ eventName, message, lienListe }),
      }),
    ),
  );

  return { error: null };
}
