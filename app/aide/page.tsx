import type { Metadata } from "next";
import PageLegale from "@/components/layout/PageLegale";

export const metadata: Metadata = {
  title: "Aide | Kdovie",
};

// FAQ étendue — voir CLAUDE.md > "Backlog produit : pages 'À propos', 'Aide'
// (19 août 2026)". Reprend telles quelles les 5 questions déjà écrites sur
// l'accueil (components/accueil/AccueilClient.tsx, const FAQS) pour rester
// cohérent d'un endroit à l'autre, et en ajoute d'autres pour couvrir des cas
// concrets déjà construits dans le produit (annulation, suppression de
// liste, sur-financement d'une cagnotte...).
function Question({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-heading text-lg font-bold text-[#4A3529]">{question}</h3>
      <p className="text-[16px] leading-relaxed text-[#5C4436]">{children}</p>
    </div>
  );
}

export default function AidePage() {
  return (
    <PageLegale title="Aide">
      <p className="text-[16px] leading-relaxed text-[#5C4436]">
        Les réponses aux questions les plus fréquentes, organisateurs comme invités. Vous ne
        trouvez pas la vôtre ? Écrivez-nous à{" "}
        <a href="mailto:contact@kdovie.com" className="underline">
          contact@kdovie.com
        </a>
        .
      </p>

      <section className="flex flex-col gap-5">
        <h2 className="font-heading text-2xl font-bold text-corail">Se connecter</h2>
        <Question question="Je n'ai pas reçu mon lien de connexion, que faire ?">
          Vérifiez d&apos;abord vos spams et l&apos;adresse saisie. Pour des raisons de sécurité,
          le nombre de liens envoyés par email est limité sur une courte période : si vous en avez
          demandé plusieurs d&apos;affilée, patientez quelques minutes avant de réessayer.
        </Question>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-heading text-2xl font-bold text-corail">Créer et gérer une liste</h2>
        <Question question="Comment créer ma première liste ?">
          Connectez-vous par lien magique (pas de mot de passe à retenir), puis créez une liste :
          un nom suffit, l&apos;occasion et la date restent facultatives. Ajoutez ensuite vos
          cadeaux en collant le lien d&apos;une page produit — le nom, la photo et le prix se
          remplissent automatiquement quand c&apos;est possible — ou en saisie manuelle.
        </Question>
        <Question question="Puis-je ajouter un cadeau de n'importe quelle boutique ?">
          Oui. Collez l&apos;adresse de la page produit : Kdovie récupère la photo, le nom et le
          prix. Vous pouvez aussi tout saisir à la main.
        </Question>
        <Question question="Comment modifier ou supprimer un cadeau de ma liste ?">
          Tant qu&apos;aucun invité n&apos;a réservé ou cotisé dessus, vous pouvez modifier son
          titre, son prix, son image et ses précisions, ou le supprimer, depuis la page de gestion
          de votre liste. Dès qu&apos;un invité agit dessus, l&apos;article passe en lecture seule
          — ça garde une trace fiable de ce qui a déjà été offert.
        </Question>
        <Question question="Puis-je fermer temporairement ma liste, ou la supprimer ?">
          Vous pouvez la refermer à tout moment (elle redevient un brouillon invisible pour vos
          invités) puis la rouvrir plus tard, sans rien perdre. La suppression, elle, est
          définitive de votre côté : la liste disparaît de votre tableau de bord et son lien ne
          fonctionne plus pour vos invités.
        </Question>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-heading text-2xl font-bold text-corail">Vos invités</h2>
        <Question question="Mes invités doivent-ils créer un compte ?">
          Non. Ils ouvrent le lien, choisissent un cadeau et laissent leur prénom. C&apos;est tout.
        </Question>
        <Question question="Est-ce que je vois qui a réservé quoi ?">
          Par défaut, les réservations et cotisations restent floutées pour préserver la surprise
          — vous pouvez les révéler à tout moment, d&apos;un simple clic.
        </Question>
        <Question question="Un invité peut-il annuler sa réservation ?">
          Oui, s&apos;il a laissé son email : l&apos;email de confirmation reçu contient un lien
          d&apos;annulation. Le cadeau redevient aussitôt disponible pour les autres invités.
        </Question>
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-heading text-2xl font-bold text-corail">Cagnottes et paiement</h2>
        <Question question="Comment fonctionne l'argent d'une cagnotte ?">
          Chaque participation part directement vers vous via Stripe, notre partenaire de
          paiement, sans attendre la fin de la cagnotte. Si elle n&apos;atteint pas son objectif,
          vous recevez quand même ce qui a été collecté — il n&apos;y a pas de remboursement
          automatique.
        </Question>
        <Question question="Comment recevoir l'argent d'une cagnotte ?">
          Depuis « Mon compte », connectez votre compte Stripe : quelques informations à renseigner
          une seule fois, puis l&apos;argent de toutes vos cagnottes vous est versé directement.
          Tant que la vérification n&apos;est pas terminée, les cotisations restent possibles mais
          le versement est différé le temps qu&apos;elle aboutisse.
        </Question>
        <Question question="Que se passe-t-il si la cagnotte dépasse le prix du cadeau ?">
          Il n&apos;y a pas de plafond ni de remboursement : le surplus reste acquis, comme un
          petit bonus en plus du cadeau.
        </Question>
        <Question question="Est-ce que Kdovie est gratuit ?">
          Créer un compte et des listes est gratuit et sans limite. Seules les cagnottes ont de
          petits frais (traitement bancaire et une commission Kdovie), toujours affichés clairement
          avant le paiement.
        </Question>
      </section>
    </PageLegale>
  );
}
