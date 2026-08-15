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
- Logo : wordmark "kdovie" en minuscules, pictogramme façon paquet cadeau (boîte corail, couvercle jaune, ruban crème, nœud en deux boucles vert sauge). SVG canonique, à réutiliser tel quel partout où le logo apparaît — ne pas réinventer un autre dessin :

```tsx
<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
  <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
  <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
  <path d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z" fill="#8BA888" />
  <path d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z" fill="#8BA888" />
</svg>
```

Déjà implémenté avec ce SVG exact dans `app/page.tsx`. Une version précédente (boîte + ruban + deux cercles, corail/crème uniquement) a été essayée puis écartée — ne pas y revenir.

Ces tokens sont déjà câblés dans `app/globals.css` (`@theme inline`) du projet starter — les réutiliser plutôt que d'en introduire de nouveaux.

## Authentification

- Concerne uniquement les organisateurs — les invités n'ont jamais besoin de compte (réservation/cotisation anonymes, déjà acté dans le périmètre MVP)
- Méthode retenue : lien magique par email (passwordless) via Supabase Auth, pas de mot de passe à gérer
- Prévoir une table `profiles` (ou équivalent) liée à `auth.users` pour stocker les informations propres à l'organisateur au-delà de l'email (nom affiché, etc.)

## Modèle de données

Schéma complet dans `supabase/migrations/0002_events_gift_items.sql` — s'y référer telle quelle, ne pas improviser un autre schéma par-dessus.

- `profiles` : un par organisateur (migration 0001)
- `events` : événements d'un organisateur, `type` limité à naissance/anniversaire/mariage/noel/pot_depart/cremaillere/bapteme, `slug` unique pour l'URL publique
- `gift_items` : articles d'un événement. `mode` = réglage organisateur (auto / cotisation_obligatoire / cotisation_impossible), `status` = état réel (disponible / reserve / cagnotte), `funded_amount_cents` = total public cotisé. Un trigger empêche de changer `mode` une fois `status` sorti de `disponible`
- `reservations` : une par article max (contrainte unique), écriture réservée au service_role
- `contributions` : détail des cotisations, statut pending/succeeded/failed, écriture réservée au service_role
- `organizer_stripe_accounts` : lien vers le compte Stripe Connect Express de l'organisateur, `payouts_enabled` reflète le statut KYC

Deux fonctions Postgres `security definer` à utiliser depuis les Route Handlers via le client `service_role` (jamais depuis le navigateur, jamais de logique de verrouillage dupliquée côté app) :
- `reserve_gift_item(gift_item_id, guest_name, guest_email)` — verrouille l'article en réservation directe, row lock atomique
- `confirm_contribution(contribution_id)` — à appeler depuis le webhook Stripe une fois le paiement confirmé, verrouille l'article en cagnotte et incrémente `funded_amount_cents`

Après avoir appliqué la migration, régénérer les types TypeScript (`supabase gen types typescript`) plutôt que de retyper le schéma à la main.

## Gabarits par type d'événement

Pas de contenu pré-rempli complexe pour le MVP — juste des catégories suggérées par type, utilisées comme filtres/tags à l'ajout d'un article (pas obligatoires) :

- `naissance` : Poussette & mobilité, Chambre & sommeil, Repas & allaitement, Vêtements, Éveil & jouets
- `anniversaire` : Idées cadeaux, Expériences, Livres & jeux
- `mariage` : Maison & déco, Voyage de noces, Expériences, Cagnotte libre
- `noel` : Idées cadeaux, Jouets, Gastronomie
- `pot_depart` : Cadeau collectif, Carte/mot, Cagnotte
- `cremaillere` : Déco, Cuisine, Jardin
- `bapteme` : Bijoux & souvenirs, Chambre, Livres

À garder en simples constantes côté app, facilement modifiables — ce n'est pas un système de contenu à sur-ingénierer.

## Routes (décisions prises au fil du développement, à ne pas redécider)

- `/compte` : dashboard organisateur, liste ses événements
- `/compte/evenements/nouveau` : création d'un événement
- `/compte/evenements/[slug]` : gestion d'un événement — filtre explicitement `organizer_id = user.id` en plus de la policy RLS (la lecture de `events` est publique par design, ce filtre applicatif évite qu'un organisateur atterrisse sur la page de gestion d'un événement qui n'est pas le sien en devinant un slug)
- `/liste/[slug]` : page publique de la liste, consultée par les invités sans compte, avec réservation en direct et synchronisation temps réel (tâches #16/#17)

## Parcours utilisateurs prioritaires

1. Organisateur : créer un compte → créer un événement → ajouter des articles → partager la liste
2. Invité : ouvrir le lien → consulter la liste → réserver un article ou cotiser → confirmer

## Scraping des métadonnées d'article (tâche #16)

- Le scraping se fait côté serveur uniquement (Route Handler ou Server Action) — jamais côté navigateur, à cause des restrictions CORS sur des domaines arbitraires.
- Librairie : `cheerio` pour parser le HTML récupéré.
- Ordre de priorité pour l'extraction :
  1. Données structurées JSON-LD de type `Product`/`Offer` (le plus fiable pour le prix)
  2. Balises Open Graph (`og:title`, `og:image`, `og:price:amount` / `product:price:amount`)
  3. `<title>` en dernier recours pour le titre uniquement
  4. Si aucun prix trouvé : champ laissé vide, jamais de valeur inventée — l'organisateur le saisit à la main
- User-Agent réaliste sur la requête de fetch (certains sites bloquent les requêtes sans UA de navigateur), timeout raisonnable (~8s), et dans tous les cas le formulaire doit rester utilisable manuellement si le scraping échoue ou timeout — ne jamais bloquer l'ajout d'un article sur l'échec du scraping.
- Hors périmètre de cette tâche, à ne pas anticiper : génération de lien d'affilié (tâche #19, le prix stocké est celui scrapé/saisi, le lien stocké est l'URL source telle quelle) ; boutons "réserver"/"cotiser" sur la page publique `/liste/[slug]` (tâches #17/#18, cette tâche affiche la liste en lecture seule avec le statut de chaque article).

## Réservation d'article par un invité (tâche #17)

- Bouton "Réserver" visible sur `/liste/[slug]` uniquement si `status = 'disponible'` et `mode != 'cotisation_obligatoire'`.
- Pour les articles en `cotisation_obligatoire`, ou déjà en `status = 'cagnotte'` : pas de bouton d'action pour l'instant, juste le badge de statut — la cotisation arrive avec la tâche #18, ne pas construire une UI de cotisation par anticipation.
- Formulaire invité minimal déclenché par le clic : prénom/nom (obligatoire), email (optionnel, sert à prévenir en cas d'annulation future).
- L'écriture ne passe jamais par un appel RPC direct depuis le navigateur : un Route Handler / Server Action utilise le client `service_role` (`lib/supabase/admin.ts`) pour appeler `reserve_gift_item`. Ça permet de garder une validation et une éventuelle limitation de fréquence côté serveur.
- Gérer proprement l'échec de la fonction (article déjà réservé entre-temps par quelqu'un d'autre, cas de double-clic simultané) avec un message clair à l'invité plutôt qu'une erreur brute.
- Synchronisation temps réel : la page publique s'abonne aux changements de `gift_items` via Supabase Realtime (`postgres_changes` sur UPDATE, filtré par `event_id`) pour refléter en direct une réservation faite par un autre invité pendant la consultation, sans nécessiter un rechargement manuel — c'est le mécanisme anti-doublon prévu dès le cadrage initial.

## Cagnotte et frais (tâche #18)

- Kdovie prend une commission de **1%** sur chaque contribution, prélevée via `application_fee_amount` de Stripe Connect (versée directement sur le compte Stripe de Kdovie, sans jamais transiter par un compte intermédiaire côté app — cohérent avec la contrainte ACPR déjà posée).
- Les frais de traitement Stripe (1,5% + 0,25€ pour une carte UE, 2,5% + 0,25€ hors UE) ne sont pas absorbés par Kdovie.
- L'organisateur choisit, au niveau de l'événement, entre deux modes (nouvelle colonne sur `events`, ex. `fee_mode` avec valeurs `frais_en_sus` / `frais_deduits`) :
  - **`frais_en_sus` (valeur par défaut)** : le montant que l'organisateur reçoit net correspond exactement au montant que l'invité choisit de cotiser (ex. l'invité choisit 20€ → l'organisateur reçoit 20€ net). Le montant réellement prélevé sur la carte de l'invité est majoré pour couvrir les frais Stripe et la commission Kdovie.
  - **`frais_deduits`** : l'invité paie exactement le montant choisi, l'organisateur reçoit ce montant diminué des frais Stripe et de la commission Kdovie de 1%.
- Formule pour le mode `frais_en_sus` (à calculer côté serveur avant de créer le PaymentIntent) :

  ```
  montant_prélevé = (montant_net_souhaité + frais_fixe_stripe) / (1 − taux_stripe − taux_kdovie)
  ```

  avec `taux_stripe = 0.015` et `frais_fixe_stripe = 0.25€` (hypothèse carte UE par défaut), `taux_kdovie = 0.01`. Ne jamais se contenter d'additionner naïvement les frais au montant net souhaité — Stripe prélève son pourcentage sur le montant total réellement facturé (qui inclut déjà la majoration), une simple addition sous-facture légèrement l'organisateur.
- Le réglage `fee_mode` est modifiable par l'organisateur à tout moment : il n'affecte que les contributions futures, pas de verrouillage nécessaire (contrairement au `mode` des articles qui se verrouille après action d'un invité).
- Afficher clairement à l'invité, avant paiement, le détail en mode `frais_en_sus` (ex. "20,00€ pour le cadeau + 0,75€ de frais = 20,75€ prélevés") pour éviter toute impression de frais cachés — sujet sensible sur de l'argent destiné à un cadeau.

## Points d'attention techniques

- Stripe Connect Express : l'onboarding KYC peut prendre plusieurs jours. L'invité peut cotiser même si l'organisateur n'a pas fini sa vérification (statut "en attente"), mais le reversement est bloqué jusqu'à validation. Prévoir un état d'UI "cagnotte en validation".
- Fenêtre de tracking affiliation courte (10 jours chez Fnac par ex.) alors que la liste vit des mois — rafraîchir le lien affilié à chaque consultation plutôt que de générer un lien statique une fois.
- RGPD à traiter dès la conception, pas en rattrapage (données d'invités, adresses, parfois données liées à des mineurs pour les listes de naissance).

## Backlog et statut (au moment de la bascule vers Claude Code)

Terminé : cadrage fonctionnel MVP, naming (Kdovie), identité visuelle, choix des prestataires techniques, wireframes des parcours clés, maquettes UI, scaffold Next.js initial (voir starter fourni). Logo corrigé dans `app/page.tsx` pour correspondre exactement au SVG canonique ci-dessus (deux tentatives précédentes s'en étaient écartées).

## Historique de l'identité visuelle (à ne pas rejouer)

Trois versions du pictogramme ont été essayées avant de se stabiliser sur la version boîte corail / couvercle jaune / ruban crème / nœud vert sauge (celle du SVG canonique ci-dessus) : un rond abstrait, puis une version boîte + ruban + deux cercles en corail/crème uniquement. Les deux ont été explicitement écartées par l'utilisateur. Ne pas y revenir même si elles semblent "plus proches" du cadrage initial — la version actuelle est un choix assumé, pas un oubli.

En cours : statut juridique et conformité paiement (modification des statuts de la société, RC Pro, CGU/CGV dédiées — actions côté utilisateur, pas de dépendance technique bloquante pour coder). Authentification organisateur (lien magique) en place. Modèle de données défini (migration 0002, voir section dédiée ci-dessus) — reste à appliquer et à construire l'app dessus.

Création de liste par gabarit terminée (dashboard, formulaire de création, page de gestion par événement — voir section Routes ci-dessus).

Ajout d'article multi-boutique terminé (scraping, formulaire d'ajout, sélecteur de mode, page publique `/liste/[slug]` en lecture seule).

Réservation d'article par un invité terminée (bouton conditionnel, formulaire invité, synchronisation temps réel). Migration `0003_gift_items_realtime.sql` (ajout de `gift_items` à la publication `supabase_realtime`) écrite mais pas encore appliquée à la base distante — à faire manuellement via le SQL Editor Supabase, comme pour les migrations précédentes.

À venir, dans l'ordre : cagnotte Stripe Connect, liens d'affiliation, bêta fermée, lancement.

## Workflow git

Fais un commit à chaque fois qu'une tâche du backlog (ou une fonctionnalité significative) est terminée et validée — pas un seul gros commit en fin de session. Message clair, en français, qui référence la tâche si pertinent (ex : "feat: ajout d'article multi-boutique avec scraping (#16)"). Ne commite jamais un état qui ne build pas ou dont les tests/lint échouent.

Le remote `origin` est configuré (https://github.com/thierrylachatpro/kdovie). Chaque `git push` doit être explicitement confirmé par l'utilisateur avant d'être exécuté — ne jamais pousser automatiquement sans demander, le commit local suffit à la fin d'une tâche.

## Mode de collaboration

L'utilisateur pilote le produit avec un chef de projet Claude dans une conversation séparée (cadrage, décisions business/design, arbitrages). Ce fichier est le résumé de ce qui a été décidé là-bas. Si une décision fonctionnelle ou business manque ici pour avancer, pose la question à l'utilisateur plutôt que de trancher seul — il pourra la reporter dans l'autre conversation pour que ce fichier soit mis à jour en conséquence.
