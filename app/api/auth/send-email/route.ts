import { Webhook } from "standardwebhooks";
import { sendTransactionalEmail } from "@/lib/send-email";
import LienMagiqueEmail from "@/components/emails/LienMagiqueEmail";

// Supabase Auth "Send Email Hook" : intercepte l'envoi natif du lien
// magique et délègue à Resend pour la cohérence visuelle avec la charte
// Kdovie, voir CLAUDE.md > "Emails transactionnels". Réservé au lien magique
// (email_action_type "magiclink") — les autres types d'action (recovery,
// signup...) ne sont pas utilisés dans le produit et sont ignorés ici.
//
// Toujours répondre 200, même en cas d'échec : un code différent déclenche
// des réessais côté Supabase et peut bloquer la connexion de l'organisateur
// selon la doc officielle — jamais souhaitable ici.
type SendEmailHookPayload = {
  user: { email: string };
  email_data: {
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
  };
};

export async function POST(request: Request) {
  const payload = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  const hookSecretRaw = process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET;
  if (!hookSecretRaw) {
    console.log("[email] SUPABASE_SEND_EMAIL_HOOK_SECRET absente, hook ignoré");
    return Response.json({}, { status: 200 });
  }

  try {
    const hookSecret = hookSecretRaw.replace("v1,whsec_", "");
    const wh = new Webhook(hookSecret);
    const { user, email_data } = wh.verify(payload, headers) as SendEmailHookPayload;

    if (email_data.email_action_type !== "magiclink") {
      console.log(
        `[email] type d'action non géré par ce hook (${email_data.email_action_type}), ignoré`,
      );
      return Response.json({}, { status: 200 });
    }

    const confirmationUrl = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`);
    confirmationUrl.searchParams.set("token", email_data.token_hash);
    confirmationUrl.searchParams.set("type", email_data.email_action_type);
    confirmationUrl.searchParams.set("redirect_to", email_data.redirect_to);

    await sendTransactionalEmail({
      to: user.email,
      subject: "Votre lien de connexion Kdovie",
      react: LienMagiqueEmail({ confirmationUrl: confirmationUrl.toString() }),
    });
  } catch (error) {
    console.log(
      "[email] échec du hook send-email :",
      error instanceof Error ? error.message : error,
    );
  }

  return Response.json({}, { status: 200 });
}
