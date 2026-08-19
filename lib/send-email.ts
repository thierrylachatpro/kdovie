import type { ReactElement } from "react";
import { resend, EMAIL_FROM } from "@/lib/resend";

// Envoi non bloquant, voir CLAUDE.md > "Emails transactionnels" : si
// RESEND_API_KEY est absente ou que l'envoi échoue, on logue et on avale
// l'erreur — aucun email raté ne doit empêcher la réservation, la
// cotisation, l'invitation ou la connexion elle-même de fonctionner. Même
// principe que le repli déjà en place pour ScrapingAnt/Amazon Associates.
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `[email] RESEND_API_KEY absente, envoi ignoré ("${params.subject}" -> ${params.to})`,
    );
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      react: params.react,
    });

    if (error) {
      console.log(
        `[email] échec d'envoi ("${params.subject}" -> ${params.to}) :`,
        error.message,
      );
    }
  } catch (error) {
    console.log(
      `[email] erreur d'envoi ("${params.subject}" -> ${params.to}) :`,
      error instanceof Error ? error.message : error,
    );
  }
}
