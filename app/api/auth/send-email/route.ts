import { Webhook } from "standardwebhooks";
import { sendTransactionalEmail } from "@/lib/send-email";
import LienMagiqueEmail from "@/components/emails/LienMagiqueEmail";

// Supabase Auth "Send Email Hook" : intercepte l'envoi natif du lien
// magique et délègue à Resend pour la cohérence visuelle avec la charte
// Kdovie, voir CLAUDE.md > "Emails transactionnels". Couvre "magiclink" et
// "signup" : signInWithOtp renvoie "signup" (pas "magiclink") la toute
// première fois qu'un compte est créé/recréé (aucune session confirmée
// encore), et "magiclink" seulement pour les connexions suivantes d'un
// compte déjà existant — les deux doivent envoyer le même email de
// connexion Kdovie, l'expérience utilisateur est identique dans les deux
// cas. Bug découvert le 20 août 2026 : l'ancienne version ne traitait que
// "magiclink", ignorant silencieusement "signup" — aucun email n'était
// jamais envoyé pour un compte nouvellement (re)créé. Les autres types
// d'action (recovery, email_change...) ne sont pas utilisés dans le
// produit et restent ignorés.
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

    if (email_data.email_action_type !== "magiclink" && email_data.email_action_type !== "signup") {
      console.log(
        `[email] type d'action non géré par ce hook (${email_data.email_action_type}), ignoré`,
      );
      return Response.json({}, { status: 200 });
    }

    // Pointe vers une page Kdovie (/auth/confirmer) plutôt que directement
    // vers l'endpoint Supabase /auth/v1/verify — un lien mail qui déclenche
    // la vérification dès qu'il est visité (même par GET) risque d'être
    // "pré-visité" automatiquement par un scanner de liens côté client mail
    // (Gmail notamment, cas constaté en conditions réelles), ce qui grille
    // le token_hash à usage unique avant même que l'organisateur ne clique
    // lui-même. /auth/confirmer exige un vrai clic (Server Action, jamais
    // déclenché par un simple GET de scanner) avant d'appeler verifyOtp —
    // voir CLAUDE.md > "Bug lien magique grillé par un pré-scan automatique".
    const redirectToUrl = new URL(email_data.redirect_to);
    const next = redirectToUrl.searchParams.get("next") ?? "/compte";

    const confirmationUrl = new URL("/auth/confirmer", redirectToUrl.origin);
    confirmationUrl.searchParams.set("token_hash", email_data.token_hash);
    confirmationUrl.searchParams.set("type", email_data.email_action_type);
    confirmationUrl.searchParams.set("next", next);

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
