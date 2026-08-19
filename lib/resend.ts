import { Resend } from "resend";

// Client Resend côté serveur uniquement — même schéma que lib/stripe.ts.
// Voir CLAUDE.md > "Emails transactionnels". Contrairement au SDK Stripe,
// le constructeur Resend lève une exception si la clé est vide (fait planter
// le build entier) — repli sur une valeur factice jamais utilisée en
// pratique, sendTransactionalEmail (lib/send-email.ts) vérifie
// RESEND_API_KEY avant tout appel réel.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_non_configuree");

export const EMAIL_FROM = "Kdovie <contact@kdovie.com>";
