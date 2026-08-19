import { Text, Link } from "@react-email/components";
import EmailLayout, { emailStyles } from "@/components/emails/EmailLayout";

export default function LienMagiqueEmail({ confirmationUrl }: { confirmationUrl: string }) {
  return (
    <EmailLayout preview="Votre lien de connexion Kdovie">
      <Text style={emailStyles.titre}>Votre lien de connexion</Text>
      <Text style={emailStyles.texte}>
        Cliquez sur le bouton ci-dessous pour vous connecter à votre compte Kdovie. Ce lien est
        valable une heure et ne fonctionne qu&apos;une seule fois.
      </Text>
      <Link href={confirmationUrl} style={emailStyles.bouton}>
        Me connecter
      </Link>
      <Text style={emailStyles.texteDoux}>
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, vous pouvez ignorer cet
        e-mail sans risque.
      </Text>
    </EmailLayout>
  );
}
