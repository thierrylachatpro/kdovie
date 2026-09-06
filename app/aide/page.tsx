import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";
import PageLegale from "@/components/layout/PageLegale";

export const metadata: Metadata = pageMetadata({
  title: "Aide",
  description:
    "Questions fréquentes sur Kdovie : créer une liste de cadeaux, ajouter des articles depuis n'importe quelle boutique, réserver, participer à une cagnotte commune, annuler une réservation.",
  path: "/aide",
});

// FAQ étendue — voir CLAUDE.md > "Backlog produit : pages 'À propos', 'Aide'
// (19 août 2026)". Reprend telles quelles les 5 questions déjà écrites sur
// l'accueil (components/accueil/AccueilClient.tsx, const FAQS) pour rester
// cohérent d'un endroit à l'autre, et en ajoute d'autres pour couvrir des cas
// concrets déjà construits dans le produit (annulation, suppression de
// liste, sur-financement d'une cagnotte...).
function Question({
  question,
  id,
  children,
}: {
  question: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="flex scroll-mt-24 flex-col gap-2">
      <h3 className="font-heading text-lg font-bold text-[#4A3529]">{question}</h3>
      <div className="text-[16px] leading-relaxed text-[#5C4436]">{children}</div>
    </div>
  );
}

export default async function AidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pseudo: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .single();
    pseudo = profile?.first_name?.trim() || user.email?.split("@")[0] || null;
  }

  return (
    <PageLegale title="Aide" estConnecte={Boolean(user)} pseudo={pseudo}>
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
          Chaque participation est encaissée pour vous via Stripe, notre partenaire de paiement,
          sans attendre la fin de la cagnotte. Si elle n&apos;atteint pas son objectif, vous
          récupérez quand même ce qui a été collecté — il n&apos;y a pas de remboursement
          automatique.
        </Question>
        <Question question="Comment recevoir l'argent d'une cagnotte ?">
          Depuis « Mon compte », connectez votre compte Stripe : quelques informations à renseigner
          une seule fois. Ensuite, vous récupérez l&apos;argent de vos cagnottes quand vous le
          souhaitez, cadeau par cadeau (voir ci-dessous). Tant que la vérification de votre compte
          n&apos;est pas terminée, les cotisations restent possibles mais le versement attend
          qu&apos;elle aboutisse.
        </Question>
        <Question
          id="delais-de-versement"
          question="Quand et à quel rythme vais-je recevoir l'argent ?"
        >
          <span className="block">
            C&apos;est vous qui décidez. L&apos;argent n&apos;est jamais viré automatiquement : il
            reste sur votre compte Stripe jusqu&apos;à ce que vous demandiez son versement.
          </span>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              Sur la page de gestion de votre liste, chaque cadeau ayant reçu au moins une
              cotisation affiche un bouton <strong>« Me reverser cette cagnotte »</strong>.
            </li>
            <li>
              Une fenêtre vous confirme le montant qui sera viré. Après validation, il arrive sur
              votre compte bancaire sous environ <strong>2 jours ouvrés</strong>.
            </li>
            <li>
              Si une partie des cotisations est trop récente, seul le montant déjà disponible est
              proposé — le reste pourra être reversé quelques jours plus tard. Vous pouvez donc
              reverser une même cagnotte en plusieurs fois.
            </li>
            <li>
              Vous pouvez attendre la fin de la cagnotte ou vous reverser au fil de l&apos;eau,
              comme vous préférez. Pensez simplement à ne pas laisser l&apos;argent dormir trop
              longtemps : passé quelques mois sans aucun versement, notre partenaire Stripe peut en
              restreindre l&apos;accès (nous vous envoyons un rappel par e-mail bien avant).
            </li>
          </ul>
          <span className="mt-2 block">
            Vous pouvez suivre votre solde et le détail de chaque versement à tout moment depuis
            « Mon compte », bouton « Voir mon solde et mes versements ».
          </span>
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
