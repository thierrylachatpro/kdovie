import { Text, Link } from "@react-email/components";
import EmailLayout, { emailStyles } from "@/components/emails/EmailLayout";
import { SITE_URL } from "@/lib/site-url";

export default function BienvenueEmail() {
  return (
    <EmailLayout preview="Bienvenue sur Kdovie">
      <Text style={emailStyles.titre}>Bienvenue sur Kdovie</Text>
      <Text style={emailStyles.texte}>
        Votre compte est prêt. Vous pouvez dès maintenant créer une première liste — naissance,
        anniversaire, mariage, Noël... — et y ajouter des cadeaux depuis n&apos;importe quelle
        boutique en ligne, simplement en collant le lien du produit.
      </Text>
      <Text style={emailStyles.texte}>
        Vos proches réservent ou cotisent en quelques clics, sans avoir besoin de créer de compte.
        Et de votre côté, vous gardez la surprise : les réservations et cotisations restent
        floutées, à révéler seulement quand vous le souhaitez.
      </Text>
      <Link href={`${SITE_URL}/compte/evenements/nouveau`} style={emailStyles.bouton}>
        Créer ma première liste
      </Link>
      <Text style={emailStyles.texteDoux}>
        Une question ? Toutes les réponses sont sur notre page{" "}
        <Link href={`${SITE_URL}/aide`} style={{ color: "#8A7263" }}>
          Aide
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}
