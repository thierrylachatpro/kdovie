import { Text, Link } from "@react-email/components";
import EmailLayout, { emailStyles } from "@/components/emails/EmailLayout";
import { formatPriceCents } from "@/lib/gift-item";

export default function CotisationConfirmeeEmail({
  giftTitle,
  eventName,
  amountCents,
  buyUrl,
  isAffiliate,
}: {
  giftTitle: string;
  eventName: string;
  amountCents: number;
  buyUrl: string | null;
  isAffiliate: boolean;
}) {
  return (
    <EmailLayout preview={`Votre cotisation pour « ${giftTitle} » est confirmée`}>
      <Text style={emailStyles.titre}>Merci pour votre cotisation !</Text>
      <Text style={emailStyles.texte}>
        Votre participation de <strong>{formatPriceCents(amountCents)}</strong> pour «{" "}
        <strong>{giftTitle}</strong> » sur la liste « <strong>{eventName}</strong> » a bien été
        prise en compte.
      </Text>
      <Text style={emailStyles.texteDoux}>
        Cet e-mail vient en complément du reçu de paiement déjà envoyé par Stripe.
      </Text>
      {buyUrl && (
        <>
          <Link href={buyUrl} style={emailStyles.bouton}>
            Voir le cadeau
          </Link>
          {isAffiliate && (
            <Text style={{ ...emailStyles.texteDoux, fontSize: 12, margin: "8px 0 0" }}>
              Lien affilié — Kdovie peut percevoir une commission, sans coût supplémentaire
              pour vous.
            </Text>
          )}
        </>
      )}
    </EmailLayout>
  );
}
