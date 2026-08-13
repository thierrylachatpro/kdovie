# Kdovie — contexte projet pour Claude Code

Ce fichier est le pont entre le cadrage fait en amont (dans une conversation Cowork avec Claude, qui joue le rôle de chef de projet) et le développement effectif, fait ici avec Claude Code. Lis-le en entier avant de commencer à coder. Ne redécide pas ce qui est déjà tranché ci-dessous sans en discuter avec l'utilisateur — ces choix viennent d'un travail de cadrage déjà validé.

## Vision produit

Plateforme web de listes de cadeaux généraliste et multi-événements : un compte permanent par utilisateur, auquel se rattachent toutes ses listes dans le temps (naissance, anniversaire récurrent, mariage, Noël, pot de départ, crémaillère...), avec ajout d'articles depuis n'importe quelle boutique en ligne et cotisation fractionnée possible sur n'importe quel cadeau.

Différenciation vs le marché français existant (Mes Envies, Milirose, iKadoo, Kadolog, Tilune, Zankyou) : personne ne combine aujourd'hui compte persistant multi-événements + cagnotte fractionnée fiable sur un article externe.

## Stack technique (déjà tranchée, ne pas remettre en question)

- Next.js (App Router) + TypeScript + Tailwind v4
- Supabase : Postgres + Auth + Realtime (le realtime sert à la synchronisation anti-doublon des réservations)
- Stripe Connect (comptes Express) pour la cagnotte fractionnée — le flux d'argent doit toujours transiter directement via Stripe vers l'organisateur, jamais collecté d'abord sur un compte intermédiaire (pour rester hors du champ de l'agrément ACPR)
- Resend pour les emails transactionnels
- Hébergement Vercel
- Domaine : kdovie.com (acheté), kdovie.fr et kdovie.app à réserver

## Périmètre fonctionnel du MVP

**Dans le périmètre :**
- Compte utilisateur permanent, plusieurs événements dans le temps rattachés au même compte
- Gabarits de liste par type d'événement (naissance, anniversaire, mariage, Noël, pot de départ, crémaillère, baptême)
- Ajout d'article par collage d'URL avec scraping des métadonnées (titre, prix, image) — pas d'extension navigateur en v1
- Réservation d'un article par un invité sans compte obligatoire, synchronisation temps réel anti-doublon
- Cagnotte et contribution fractionnée sur un article externe (pas seulement un fonds cash générique)
- Liens d'affiliation générés automatiquement quand un programme existe (Amazon Associates, Awin/Fnac...), sinon lien direct — respecter les règles de chaque programme (pas de redirection automatique, pas d'iframe, attribut nofollow)
- Confidentialité : l'adresse du bénéficiaire n'est jamais transmise à un vendeur tiers

**Hors périmètre v1 (backlog v2, ne pas développer maintenant) :**
IA/suggestions, marketplace artisanale, app mobile native, offre B2B/comités d'entreprise, cercle social persistant entre événements, suivi de remerciements automatisé, seconde main, alertes de prix, extension navigateur dédiée.

## Règle de gestion : réservation vs cotisation par article

Chaque article a un mode : `automatique` (défaut), `cotisation_obligatoire`, ou `cotisation_impossible`.

- `automatique` : le premier invité qui agit détermine le mode pour tous les suivants. S'il réserve, l'article se verrouille en réservation directe (option cotiser masquée pour les autres). S'il cotise, même partiellement, l'article bascule en mode cagnotte (option réserver masquée pour les autres).
- `cotisation_obligatoire` : réglable par l'organisateur à la création de l'article. Aucune réservation directe n'est jamais proposée.
- `cotisation_impossible` : réglable par l'organisateur à la création de l'article. Seule la réservation directe est proposée.
- Le réglage organisateur n'est modifiable que tant qu'aucun invité n'a agi sur l'article. Dès la première action d'un invité, le mode est verrouillé définitivement, quel que soit le réglage.
- Sur-financement d'une cagnotte (contributions cumulées supérieures au prix affiché) : pas de plafond, pas de remboursement, le surplus est un bonus pour l'organisateur.
- Le reversement à l'organisateur peut se faire même si la cagnotte n'est pas financée à 100 %.

## Identité visuelle (palette "chaleureuse", déjà validée)

- Corail `#E8734A` — couleur principale
- Jaune doux `#F5B942` — accent
- Crème `#FFF8F0` — fond
- Vert sauge `#8BA888` — secondaire (statut "disponible")
- Typographie : Quicksand (titres, arrondi/chaleureux) + Work Sans (corps de texte)
- Logo : wordmark "kdovie" en minuscules, pictogramme simple façon paquet cadeau (boîte + ruban + nœud), déjà implémenté dans `app/page.tsx` du starter

Ces tokens sont déjà câblés dans `app/globals.css` (`@theme inline`) du projet starter — les réutiliser plutôt que d'en introduire de nouveaux.

## Parcours utilisateurs prioritaires

1. Organisateur : créer un compte → créer un événement → ajouter des articles → partager la liste
2. Invité : ouvrir le lien → consulter la liste → réserver un article ou cotiser → confirmer

## Points d'attention techniques

- Stripe Connect Express : l'onboarding KYC peut prendre plusieurs jours. L'invité peut cotiser même si l'organisateur n'a pas fini sa vérification (statut "en attente"), mais le reversement est bloqué jusqu'à validation. Prévoir un état d'UI "cagnotte en validation".
- Fenêtre de tracking affiliation courte (10 jours chez Fnac par ex.) alors que la liste vit des mois — rafraîchir le lien affilié à chaque consultation plutôt que de générer un lien statique une fois.
- RGPD à traiter dès la conception, pas en rattrapage (données d'invités, adresses, parfois données liées à des mineurs pour les listes de naissance).

## Backlog et statut (au moment de la bascule vers Claude Code)

Terminé : cadrage fonctionnel MVP, naming (Kdovie), identité visuelle, choix des prestataires techniques, wireframes des parcours clés, maquettes UI, scaffold Next.js initial (voir starter fourni).

En cours : statut juridique et conformité paiement (modification des statuts de la société, RC Pro, CGU/CGV dédiées — actions côté utilisateur, pas de dépendance technique bloquante pour coder).

À venir, dans l'ordre : authentification compte permanent (Supabase Auth), modèle de données (users, events, gift_items, reservations, contributions), création de liste par gabarit, ajout d'article multi-boutique, réservation d'article, cagnotte Stripe Connect, liens d'affiliation, bêta fermée, lancement.

## Mode de collaboration

L'utilisateur pilote le produit avec un chef de projet Claude dans une conversation séparée (cadrage, décisions business/design, arbitrages). Ce fichier est le résumé de ce qui a été décidé là-bas. Si une décision fonctionnelle ou business manque ici pour avancer, pose la question à l'utilisateur plutôt que de trancher seul — il pourra la reporter dans l'autre conversation pour que ce fichier soit mis à jour en conséquence.
