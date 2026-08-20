import type { ReactElement } from "react";
import { resend, EMAIL_FROM } from "@/lib/resend";

// Envoi non bloquant, voir CLAUDE.md > "Emails transactionnels" : si
// RESEND_API_KEY est absente ou que l'envoi échoue, on logue et on avale
// l'erreur — aucun email raté ne doit empêcher la réservation, la
// cotisation, l'invitation ou la connexion elle-même de fonctionner. Même
// principe que le repli déjà en place pour ScrapingAnt/Amazon Associates.
// Retourne quand même un booléen de succès (les 5 premiers appelants
// l'ignorent, valeur ajoutée pour /contact où l'email est l'action
// elle-même : pas d'autre résultat à protéger si l'envoi échoue, l'appelant
// doit pouvoir le signaler à l'utilisateur plutôt que de faire croire à un
// envoi réussi).
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `[email] RESEND_API_KEY absente, envoi ignoré ("${params.subject}" -> ${params.to})`,
    );
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      react: params.react,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });

    if (error) {
      console.log(
        `[email] échec d'envoi ("${params.subject}" -> ${params.to}) :`,
        error.message,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.log(
      `[email] erreur d'envoi ("${params.subject}" -> ${params.to}) :`,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
