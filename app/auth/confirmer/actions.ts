"use server";

import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/send-email";
import BienvenueEmail from "@/components/emails/BienvenueEmail";

// Déclenché uniquement par un vrai clic sur "Me connecter" (jamais par la
// simple visite GET de /auth/confirmer, qui elle-même ne fait qu'afficher
// le bouton) — voir CLAUDE.md > "Bug lien magique grillé par un pré-scan
// automatique". verifyOtp crée la session directement (même mécanisme que
// exchangeCodeForSession côté cookies, via le client @supabase/ssr), pas
// besoin d'un second aller-retour.
export async function confirmerConnexion(formData: FormData) {
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type");
  const next = formData.get("next");
  const nextPath = typeof next === "string" && next ? next : "/compte";

  if (typeof tokenHash !== "string" || !tokenHash || typeof type !== "string" || !type) {
    redirect("/connexion?erreur=lien_invalide");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error || !data.user) {
    redirect("/connexion?erreur=lien_invalide");
  }

  const desactive = await compteDesactive(data.user.id);
  if (desactive) {
    await supabase.auth.signOut();
    redirect("/connexion?erreur=compte_desactive");
  }

  await envoyerBienvenueSiPremiereConnexion(data.user.id, data.user.email);
  redirect(nextPath);
}

// Bloque la connexion d'un organisateur désactivé par un super-administrateur
// (profiles.disabled, migration 0019) — voir CLAUDE.md > "Dashboard
// super-administrateur — CRUD organisateurs". Repris à l'identique de
// l'ancien app/auth/callback/route.ts.
async function compteDesactive(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("disabled")
    .eq("id", userId)
    .single();
  return profile?.disabled === true;
}

// Email de bienvenue à la toute première connexion réussie d'un
// organisateur, voir CLAUDE.md > "Emails transactionnels — email de
// bienvenue". Repris à l'identique de l'ancien app/auth/callback/route.ts —
// update conditionnel atomique/idempotent, jamais bloquant pour la connexion.
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
