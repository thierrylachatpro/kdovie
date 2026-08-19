import { Text, Link } from "@react-email/components";
import EmailLayout, { emailStyles } from "@/components/emails/EmailLayout";

export default function ReservationConfirmeeEmail({
  giftTitle,
  eventName,
  buyUrl,
  isAffiliate,
  cancelUrl,
}: {
  giftTitle: string;
  eventName: string;
  buyUrl: string | null;
  isAffiliate: boolean;
  cancelUrl: string;
}) {
  return (
    <EmailLayout preview={`Votre réservation « ${giftTitle} » est confirmée`}>
      <Text style={emailStyles.titre}>C&apos;est réservé, merci !</Text>
      <Text style={emailStyles.texte}>
        Vous avez réservé « <strong>{giftTitle}</strong> » sur la liste «{" "}
        <strong>{eventName}</strong> ». Les autres invités ne le verront plus dans la liste.
      </Text>
      {buyUrl && (
        <>
          <Link href={buyUrl} style={emailStyles.bouton}>
            Aller l&apos;acheter
          </Link>
          {isAffiliate && (
            <Text style={{ ...emailStyles.texteDoux, fontSize: 12, margin: "8px 0 0" }}>
              Lien affilié — Kdovie peut percevoir une commission, sans coût supplémentaire
              pour vous.
            </Text>
          )}
        </>
      )}
      <Text style={{ margin: 0 }}>
        <Link href={cancelUrl} style={emailStyles.lienDiscret}>
          Annuler ma réservation
        </Link>
      </Text>
    </EmailLayout>
  );
}
