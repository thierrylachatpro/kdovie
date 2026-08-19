import { Text, Link } from "@react-email/components";
import EmailLayout, { emailStyles } from "@/components/emails/EmailLayout";

export default function InvitationEmail({
  eventName,
  message,
  lienListe,
}: {
  eventName: string;
  message: string;
  lienListe: string;
}) {
  return (
    <EmailLayout preview={`On vous invite à consulter la liste « ${eventName} »`}>
      <Text style={emailStyles.titre}>« {eventName} »</Text>
      <Text style={{ ...emailStyles.texte, whiteSpace: "pre-line" }}>{message}</Text>
      <Link href={lienListe} style={emailStyles.bouton}>
        Voir la liste
      </Link>
      <Text style={emailStyles.texteDoux}>
        Aucun compte à créer pour consulter la liste, réserver un cadeau ou cotiser.
      </Text>
    </EmailLayout>
  );
}
