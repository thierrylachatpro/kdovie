import { Text } from "@react-email/components";
import EmailLayout, { emailStyles } from "@/components/emails/EmailLayout";

export default function ContactEmail({
  nom,
  email,
  message,
}: {
  nom: string;
  email: string;
  message: string;
}) {
  return (
    <EmailLayout preview={`Message de contact de ${nom}`}>
      <Text style={emailStyles.titre}>Nouveau message depuis /contact</Text>
      <Text style={emailStyles.texte}>
        <strong>{nom}</strong> ({email})
      </Text>
      <Text style={{ ...emailStyles.texte, whiteSpace: "pre-line" }}>{message}</Text>
      <Text style={emailStyles.texteDoux}>
        Répondez directement à cet e-mail, il part vers {email}.
      </Text>
    </EmailLayout>
  );
}
