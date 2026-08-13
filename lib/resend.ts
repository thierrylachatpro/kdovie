import { Resend } from "resend";

// Client email transactionnel : confirmation de réservation, notification de
// contribution reçue, alerte de compte Stripe validé, etc.
export const resend = new Resend(process.env.RESEND_API_KEY!);
