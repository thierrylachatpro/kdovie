"use server";

import { sendTransactionalEmail } from "@/lib/send-email";
import ContactEmail from "@/components/emails/ContactEmail";

const CONTACT_EMAIL = "contact@kdovie.com";

function estEmailValide(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Formulaire public (pas de session requise) — voir CLAUDE.md > "En-tête
// unifié pour les organisateurs connectés + page Contact". `piege` est un
// champ honeypot invisible (ContactForm) : un visiteur humain ne le remplit
// jamais, seul un bot le ferait — silencieusement ignoré plutôt que
// signalé, pour ne pas renseigner le bot sur l'échec.
export async function sendContactMessage(
  nom: string,
  email: string,
  message: string,
  piege: string,
): Promise<{ error: string | null }> {
  if (piege.trim()) {
    return { error: null };
  }

  const nomTrim = nom.trim();
  const emailTrim = email.trim();
  const messageTrim = message.trim();

  if (!nomTrim || !emailTrim || !messageTrim) {
    return { error: "Merci de remplir tous les champs." };
  }

  if (!estEmailValide(emailTrim)) {
    return { error: "Vérifiez votre adresse e-mail, il manque quelque chose." };
  }

  const envoye = await sendTransactionalEmail({
    to: CONTACT_EMAIL,
    subject: `Message de contact de ${nomTrim}`,
    react: ContactEmail({ nom: nomTrim, email: emailTrim, message: messageTrim }),
    replyTo: emailTrim,
  });

  if (!envoye) {
    return {
      error:
        "Le message n'a pas pu être envoyé, réessayez ou écrivez directement à contact@kdovie.com.",
    };
  }

  return { error: null };
}
