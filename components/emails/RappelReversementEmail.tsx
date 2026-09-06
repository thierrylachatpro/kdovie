import { Text, Link } from "@react-email/components";
import EmailLayout, { emailStyles } from "@/components/emails/EmailLayout";
import { formatPriceCents } from "@/lib/gift-item";

// Rappel envoyé par le cron quand un organisateur a un solde Stripe non
// reversé depuis longtemps — filet pour l'obligation Stripe d'un virement au
// moins tous les 90 jours en mode manuel. Voir CLAUDE.md > "Reversement
// manuel de la cagnotte par article".
export default function RappelReversementEmail({
  soldeCents,
  dashboardUrl,
}: {
  soldeCents: number;
  dashboardUrl: string;
}) {
  return (
    <EmailLayout preview="De l'argent de vos cagnottes vous attend sur Kdovie">
      <Text style={emailStyles.titre}>Pensez à vous reverser vos cagnottes</Text>
      <Text style={emailStyles.texte}>
        Vous avez <strong>{formatPriceCents(soldeCents)}</strong> de cotisations qui vous
        attendent et qui n&apos;ont pas encore été virées sur votre compte bancaire.
      </Text>
      <Text style={emailStyles.texte}>
        Sur Kdovie, c&apos;est vous qui décidez quand récupérer l&apos;argent d&apos;une cagnotte :
        rendez-vous sur la page de gestion de votre liste et cliquez sur «&nbsp;Me reverser cette
        cagnotte&nbsp;» sur chaque cadeau concerné. Le virement arrive sur votre compte sous
        environ 2&nbsp;jours ouvrés.
      </Text>
      <Link href={dashboardUrl} style={emailStyles.bouton}>
        Voir mes listes
      </Link>
      <Text style={emailStyles.texteDoux}>
        Notre partenaire de paiement Stripe demande qu&apos;un virement ait lieu au moins tous les
        90&nbsp;jours. Passé ce délai sans reversement, l&apos;accès à ces fonds peut être
        suspendu&nbsp;: ne tardez pas trop.
      </Text>
    </EmailLayout>
  );
}
