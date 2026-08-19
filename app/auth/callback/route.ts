import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/send-email";
import BienvenueEmail from "@/components/emails/BienvenueEmail";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/compte";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await envoyerBienvenueSiPremiereConnexion(data.user.id, data.user.email);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const redirectUrl = new URL("/connexion", origin);
  redirectUrl.searchParams.set("erreur", "lien_invalide");
  return NextResponse.redirect(redirectUrl);
}

// Email de bienvenue à la toute première connexion réussie d'un
// organisateur, voir CLAUDE.md > "Emails transactionnels — email de
// bienvenue". `welcome_email_sent_at` (migration 0018) plutôt qu'une
// heuristique sur created_at/last_sign_in_at : l'update conditionnel
// (where ... is null, returning *) est atomique et idempotent — un rejeu du
// callback (double clic, retour arrière) ne renvoie jamais l'email deux
// fois. Écriture via service_role (comme reserve_gift_item/confirm_contribution)
// pour ne pas dépendre des policies RLS "own row" ici. Ne bloque jamais la
// connexion : toute erreur est loguée et avalée.
async function envoyerBienvenueSiPremiereConnexion(userId: string, email: string | undefined) {
  if (!email) return;

  try {
    const admin = createAdminClient();
    const { data: profil, error } = await admin
      .from("profiles")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", userId)
      .is("welcome_email_sent_at", null)
      .select("id")
      .maybeSingle();

    if (error) {
      console.log("[email] échec de la vérification première connexion :", error.message);
      return;
    }

    if (!profil) return; // Déjà envoyé (ou update concurrent) — rien à faire.

    await sendTransactionalEmail({
      to: email,
      subject: "Bienvenue sur Kdovie",
      react: BienvenueEmail(),
    });
  } catch (error) {
    console.log(
      "[email] erreur email de bienvenue :",
      error instanceof Error ? error.message : error,
    );
  }
}
