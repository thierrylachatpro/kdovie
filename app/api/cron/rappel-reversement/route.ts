import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { soldeEurCents } from "@/lib/stripe-balance";
import { sendTransactionalEmail } from "@/lib/send-email";
import RappelReversementEmail from "@/components/emails/RappelReversementEmail";
import { SITE_URL } from "@/lib/site-url";

// Filet pour l'obligation Stripe (mode payout manuel) : un virement doit
// avoir lieu au moins tous les 90 jours pour un compte français. Rien ne le
// force automatiquement — Kdovie relance l'organisateur par email avant
// l'échéance. Voir CLAUDE.md > "Reversement manuel de la cagnotte par
// article".
//
// Déclenché par Vercel Cron (vercel.json) une fois par jour. Ne renvoie un
// email que si : compte actif, pas de virement (ni de rappel) récent, et un
// solde Stripe réellement non nul.
export const dynamic = "force-dynamic";

const SEUIL_SANS_VIREMENT_JOURS = 70; // 20 jours de marge avant le plafond des 90
const ANTI_SPAM_RAPPEL_JOURS = 14;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Non autorisé", { status: 401 });
  }

  const admin = createAdminClient();
  const maintenant = Date.now();
  const seuilVirement = new Date(
    maintenant - SEUIL_SANS_VIREMENT_JOURS * 86_400_000,
  ).toISOString();
  const seuilRappel = new Date(
    maintenant - ANTI_SPAM_RAPPEL_JOURS * 86_400_000,
  ).toISOString();

  const { data: comptes } = await admin
    .from("organizer_stripe_accounts")
    .select("organizer_id, stripe_account_id, last_payout_at, last_payout_reminder_at, created_at")
    .eq("payouts_enabled", true);

  let examines = 0;
  let relances = 0;

  for (const compte of comptes ?? []) {
    // Compte trop récent : pas encore de risque d'échéance.
    if (compte.created_at > seuilVirement) continue;
    // Virement récent : rien à faire.
    if (compte.last_payout_at && compte.last_payout_at > seuilVirement) continue;
    // Déjà relancé récemment : on ne spamme pas.
    if (compte.last_payout_reminder_at && compte.last_payout_reminder_at > seuilRappel) continue;

    examines++;

    try {
      const balance = await stripe.balance.retrieve(undefined, {
        stripeAccount: compte.stripe_account_id,
      });
      const { disponible, enAttente } = soldeEurCents(balance);
      const solde = disponible + enAttente;
      if (solde <= 0) continue;

      const { data: userData } = await admin.auth.admin.getUserById(compte.organizer_id);
      const email = userData?.user?.email;
      if (!email) continue;

      await sendTransactionalEmail({
        to: email,
        subject: "De l'argent de vos cagnottes vous attend",
        react: RappelReversementEmail({ soldeCents: solde, dashboardUrl: `${SITE_URL}/compte` }),
      });

      await admin
        .from("organizer_stripe_accounts")
        .update({ last_payout_reminder_at: new Date().toISOString() })
        .eq("organizer_id", compte.organizer_id);

      relances++;
    } catch (error) {
      console.error(
        `[cron rappel-reversement] échec pour ${compte.stripe_account_id} :`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  return Response.json({ examines, relances });
}
