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

## Gestion des articles par l'organisateur : modification et suppression (16 août 2026)

Aujourd'hui, la page de gestion (`/compte/evenements/[slug]`) permet seulement d'ajouter un article et de changer son `mode` (`ModeSelect`) — pas de modification ni de suppression. À ajouter :

- **Modifier** : titre, prix, image (pas l'URL source, pas le mode qui garde son propre sélecteur).
- **Supprimer** : retrait définitif de la liste.
- **Verrouillage** : dès que `status != 'disponible'` (un invité a réservé ou cotisé, même partiellement), l'article devient en lecture seule — ni modification ni suppression, cohérent avec le verrouillage déjà en place sur `mode` (voir "Règle de gestion : réservation vs cotisation par article" plus haut, trigger `gift_items_protect_mode`). Seule reste possible la consultation.
- Comme pour `mode`, ne pas se contenter d'un simple disabled côté UI : prévoir un trigger Postgres équivalent (ou étendre `protect_gift_item_mode`) qui bloque l'update des colonnes title/price_cents/image_url et le delete une fois `status` sorti de `disponible`, pour ne pas dépendre uniquement de la désactivation front.

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

**Spinner de chargement (17 août 2026, maquette Claude Design "Logo animé.dc.html")** : composant `components/ui/KdovieSpinner.tsx`, dérivé du SVG canonique ci-dessus — le logo reste fixe, un arc de ruban tourne autour en 1,4 s (plus lisible que faire tourner l'icône entière). Deux variantes de couleurs selon le fond du bouton : `variant="light"` (défaut, anneau sage, couleurs du logo inchangées, pour un fond clair) et `variant="dark"` (anneau et boîte crème, ruban corail, pour un fond plein corail). À réutiliser tel quel pour tout nouvel indicateur de chargement — ne pas réinventer un autre spinner. Utilisé sur les 8 boutons à état d'attente de l'app (voir composants `ConnexionForm`, `EnTeteListe`, `VisibiliteListe`, `GiftItemCard`, `AjouterArticleForm`, `PseudoCard`).

## Authentification

- Concerne uniquement les organisateurs — les invités n'ont jamais besoin de compte (réservation/cotisation anonymes, déjà acté dans le périmètre MVP)
- Méthode retenue : lien magique par email (passwordless) via Supabase Auth, pas de mot de passe à gérer
- Prévoir une table `profiles` (ou équivalent) liée à `auth.users` pour stocker les informations propres à l'organisateur au-delà de l'email (nom affiché, etc.)

## Modèle de données

Schéma complet dans `supabase/migrations/0002_events_gift_items.sql` — s'y référer telle quelle, ne pas improviser un autre schéma par-dessus.

- `profiles` : un par organisateur (migration 0001)
- `events` : événements d'un organisateur, `type` limité à naissance/anniversaire/mariage/noel/pot_depart/cremaillere/bapteme **ou NULL** (type facultatif, voir section "Recadrage" plus bas — migration à part de 0002, ne pas modifier 0002 déjà appliquée), `slug` unique pour l'URL publique, `status` = `brouillon` (défaut) ou `ouverte` (voir section "Statut de liste" plus bas)
- `gift_items` : articles d'un événement. `mode` = réglage organisateur (auto / cotisation_obligatoire / cotisation_impossible), `status` = état réel (disponible / reserve / cagnotte), `funded_amount_cents` = total public cotisé. Un trigger empêche de changer `mode` une fois `status` sorti de `disponible`
- `reservations` : une par article max (contrainte unique), écriture réservée au service_role
- `contributions` : détail des cotisations, statut pending/succeeded/failed, écriture réservée au service_role
- `organizer_stripe_accounts` : lien vers le compte Stripe Connect Express de l'organisateur, `payouts_enabled` reflète le statut KYC

Deux fonctions Postgres `security definer` à utiliser depuis les Route Handlers via le client `service_role` (jamais depuis le navigateur, jamais de logique de verrouillage dupliquée côté app) :
- `reserve_gift_item(gift_item_id, guest_name, guest_email)` — verrouille l'article en réservation directe, row lock atomique
- `confirm_contribution(contribution_id)` — à appeler depuis le webhook Stripe une fois le paiement confirmé, verrouille l'article en cagnotte et incrémente `funded_amount_cents`

Après avoir appliqué la migration, régénérer les types TypeScript (`supabase gen types typescript`) plutôt que de retyper le schéma à la main.

## Gabarits par type d'événement

Pas de contenu pré-rempli complexe pour le MVP — juste des catégories suggérées par type, utilisées comme filtres/tags à l'ajout d'un article (pas obligatoires). Le choix d'un type est lui-même facultatif au niveau de la liste (voir "Recadrage" ci-dessous) — quand aucun type n'est choisi, aucune catégorie suggérée n'est proposée par défaut à l'ajout d'article :

- `naissance` : Poussette & mobilité, Chambre & sommeil, Repas & allaitement, Vêtements, Éveil & jouets
- `anniversaire` : Idées cadeaux, Expériences, Livres & jeux
- `mariage` : Maison & déco, Voyage de noces, Expériences, Cagnotte libre
- `noel` : Idées cadeaux, Jouets, Gastronomie
- `pot_depart` : Cadeau collectif, Carte/mot, Cagnotte
- `cremaillere` : Déco, Cuisine, Jardin
- `bapteme` : Bijoux & souvenirs, Chambre, Livres

À garder en simples constantes côté app, facilement modifiables — ce n'est pas un système de contenu à sur-ingénierer.

## Recadrage : une liste n'est pas obligatoirement un événement daté et typé (16 août 2026)

Décision qui affine le modèle initial sans le remettre en cause sur le fond — à ne pas re-débattre, juste à implémenter :

- **Pas de renommage.** Le mot "événement" reste tel quel partout : table `events`, routes `/compte/evenements/...`, tous les libellés UI ("Vos événements", "Type d'événement"...). Seule la notion de date/type imposés change, pas la terminologie.
- **Date : déjà optionnelle, ne pas y toucher davantage.** Le champ `event_date` est déjà nullable en base et déjà marqué "optionnelle" dans `NouvelEvenementForm`. Il reste dans le formulaire de création, discret comme aujourd'hui — pas de retrait du formulaire, pas de mise en avant non plus.
- **Type : doit devenir optionnel.** Une liste peut exister sans catégorie d'événement précise ("juste une liste"). Implique :
  - Nouvelle migration (`0004_...`, ne pas modifier `0002_events_gift_items.sql` déjà appliquée) qui rend `events.type` nullable et ajuste le check constraint pour autoriser NULL en plus des 7 valeurs existantes.
  - Dans `NouvelEvenementForm` (`components/evenements/NouvelEvenementForm.tsx`), le `<select name="type">` ne doit plus être `required` ; prévoir une option explicite du type "Aucun type précis / liste simple".
  - Partout où `eventTypeIcon`/`eventTypeLabel` (`lib/event-types.ts`) sont appelés avec un `type` potentiellement `null` (dashboard `app/compte/page.tsx`, page de gestion `app/compte/evenements/[slug]/page.tsx`, et la page publique `/liste/[slug]` si elle affiche le type), prévoir un fallback générique (icône 🎁, libellé "Liste").
  - Les 7 gabarits existants restent valables quand un type est choisi — ils ne sont pas remis en cause, seulement rendus facultatifs.
- **Pas de notion de liste passée / en cours / à venir.** Ce regroupement temporel, évoqué dans le document de cadrage initial, n'a jamais été implémenté dans le code (le dashboard actuel est une liste plate triée par date de création) — ne pas l'introduire.

## Statut de liste : brouillon / ouverte (16 août 2026)

Notion absente du modèle initial, à implémenter en plus (et indépendamment) du recadrage type/date ci-dessus — répond au besoin de préparer une liste avant de la partager :

- Nouvelle colonne `events.status` : `text not null default 'brouillon' check (status in ('brouillon', 'ouverte'))`. Migration à part (`0005_...`, après la `0004` du recadrage type — ne pas fusionner les deux migrations, garder l'historique lisible).
- Une liste est créée en `brouillon` par défaut. L'organisateur ajoute/modifie des articles normalement en brouillon, aucune restriction côté gestion `/compte/evenements/[slug]`.
- Tant que `status = 'brouillon'`, la page publique `/liste/[slug]` n'affiche pas le contenu aux invités même s'ils ont le lien : message du type "Cette liste n'est pas encore ouverte" à la place du contenu — pas de fuite d'info sur les articles/prix. La policy RLS `events_select_public` reste `using (true)` (comportement déjà en place, ne pas y toucher) ; le filtrage se fait côté app dans la page `/liste/[slug]`, pas en RLS.
- L'organisateur passe explicitement une liste en `ouverte` depuis la page de gestion (nouveau bouton "Ouvrir ma liste aux invités"). Action réversible : il peut repasser une liste `ouverte` en `brouillon` à tout moment pour suspendre temporairement le partage — pas de verrouillage définitif comme pour le `mode` des `gift_items`.
- Le statut n'a aucun impact sur l'accès à la page de gestion organisateur (toujours accessible, brouillon ou ouverte), uniquement sur ce que voit un invité sur la page publique.
- Badge de statut à afficher sur le dashboard (`/compte`) et sur la page de gestion ("Brouillon" / "Liste ouverte").

## Page "Mon compte" (profil organisateur, 16 août 2026)

Le bloc "Mon compte" en haut à droite du dashboard (`app/compte/page.tsx`, ~ligne 172-180) est aujourd'hui un `<span>` non cliquable affichant le début de l'email en fallback (`nomAffiche`, ligne 67). À transformer en lien vers une nouvelle route `/compte/profil`.

Contenu de cette page, volontairement minimal pour le MVP :
- Email de l'organisateur, en lecture seule (pas de changement d'email prévu, l'auth est un lien magique)
- Pseudo (`profiles.display_name`) éditable — la colonne existe déjà en base (migration 0001), il ne manque que le formulaire pour l'écrire. Une fois enregistré, il doit remplacer le fallback "début de l'email" partout où `nomAffiche`/`display_name` est utilisé (dashboard, bloc "Mon compte")
- Bouton de déconnexion (réutiliser `components/auth/DeconnexionButton.tsx`)

Volontairement laissé de côté à ce stade (à ne pas ajouter maintenant) : export/suppression de compte RGPD (bon à avoir, backlog v2, pas bloquant pour le MVP), préférences de notification (rien de tel n'existe encore dans le produit).

**Statut du compte Stripe Connect (tâche #18, 17 août 2026)** : la connexion/l'onboarding Stripe Connect Express de l'organisateur vit sur `/compte/profil`, pas ailleurs — c'est un réglage au niveau du compte (1 compte Stripe Connect par organisateur, table `organizer_stripe_accounts` déjà 1:1 avec `profiles`), pas au niveau d'un événement individuel. Nouvelle carte sur cette page : bouton pour démarrer/reprendre l'onboarding Express (Account Link Stripe), statut affiché (non connecté / en attente de vérification / actif), cohérent avec `payouts_enabled`.

**Un organisateur est toujours un particulier, jamais une société** : l'appel de création du compte Stripe Connect Express doit fixer `business_type: 'individual'`, sinon Stripe présente par défaut un formulaire d'onboarding orienté entreprise (SIRET etc.) qui n'a pas de sens ici. Paramètre à poser dès la création du compte connecté, pas à laisser au choix de l'organisateur.

## Pseudo public sur la page liste (17 août 2026)

Décision tranchée : le pseudo de l'organisateur (`profiles.display_name`) doit être affiché sur la page publique `/liste/[slug]` (ex. "liste de thierry"), cohérent avec le texte déjà présent sur `/compte/profil` ("Choisissez un pseudo, il apparaît sur vos listes").

- Nouvelle policy RLS publique sur `profiles`, limitée à la colonne `display_name` uniquement (pas l'email, pas les autres champs) — migration à part, ne pas élargir l'accès au-delà de ce champ.
- Si `display_name` est vide (pseudo jamais renseigné), ne rien afficher plutôt qu'un fallback du type début d'email — cette info n'a pas à fuiter côté invité (contrairement au dashboard organisateur où ce fallback reste légitime).
- À câbler dans `/liste/[slug]` : jointure ou requête complémentaire vers `profiles` pour l'organisateur de l'événement.

## Routes (décisions prises au fil du développement, à ne pas redécider)

- `/compte` : dashboard organisateur, liste ses événements
- `/compte/profil` : page de profil organisateur — pseudo éditable, email en lecture seule, déconnexion (voir section "Page 'Mon compte'" ci-dessus)
- `/compte/evenements/nouveau` : création d'un événement
- `/compte/evenements/[slug]` : gestion d'un événement — filtre explicitement `organizer_id = user.id` en plus de la policy RLS (la lecture de `events` est publique par design, ce filtre applicatif évite qu'un organisateur atterrisse sur la page de gestion d'un événement qui n'est pas le sien en devinant un slug)
- `/liste/[slug]` : page publique de la liste, consultée par les invités sans compte, avec réservation en direct et synchronisation temps réel (tâches #16/#17) — n'affiche le contenu que si `status = 'ouverte'` (voir section "Statut de liste" ci-dessus)

## Parcours utilisateurs prioritaires

1. Organisateur : créer un compte → créer un événement → ajouter des articles → partager la liste
2. Invité : ouvrir le lien → consulter la liste → réserver un article ou cotiser → confirmer

## Scraping des métadonnées d'article (tâche #16)

- Le scraping se fait côté serveur uniquement (Route Handler ou Server Action) — jamais côté navigateur, à cause des restrictions CORS sur des domaines arbitraires.
- Librairie : `cheerio` pour parser le HTML récupéré.
- Ordre de priorité pour l'extraction :
  1. Données structurées JSON-LD de type `Product`/`Offer` (le plus fiable pour le prix)
  2. Balises Open Graph (`og:title`, `og:image`, `og:price:amount` / `product:price:amount`)
  3. Microdonnées schema.org (`itemprop="name"/"image"/"price"`)
  4. Repli Amazon (17 août 2026, aucune page produit Amazon n'expose JSON-LD ni Open Graph) : `#productTitle` pour le titre, `#landingImage`/`#imgTagWrapperId img` (attribut `data-a-dynamic-image` ou `src`) pour l'image. **Pas de repli prix pour Amazon** : le prix y est affiché à de nombreux endroits de la page (produits sponsorisés, options d'achat) sans conteneur stable pour identifier le bon — un sélecteur générique renvoie parfois le prix d'un tout autre article, testé et confirmé en conditions réelles. Laisser le champ vide est plus sûr qu'un prix scrapé mais faux.
  5. `<title>` en tout dernier recours, pour le titre uniquement
  6. Si aucun prix trouvé : champ laissé vide, jamais de valeur inventée — l'organisateur le saisit à la main
- User-Agent réaliste sur la requête de fetch (certains sites bloquent les requêtes sans UA de navigateur), en-têtes `Accept`/`Accept-Language` complets (certains sites varient leur réponse selon ces en-têtes), timeout raisonnable (~8s), et dans tous les cas le formulaire doit rester utilisable manuellement si le scraping échoue ou timeout — ne jamais bloquer l'ajout d'un article sur l'échec du scraping.
- Hors périmètre de cette tâche, à ne pas anticiper : génération de lien d'affilié (tâche #19, le prix stocké est celui scrapé/saisi, le lien stocké est l'URL source telle quelle) ; boutons "réserver"/"cotiser" sur la page publique `/liste/[slug]` (tâches #17/#18, cette tâche affiche la liste en lecture seule avec le statut de chaque article).

### Relais de scraping via Hostinger — abandonné (17 août 2026)

Première tentative : utiliser l'hébergement Hostinger déjà payé par l'utilisateur (IP `213.130.145.175`, France) comme relais pour la requête sortante de scraping, afin de contourner le blocage des IP Vercel/AWS par les protections anti-bot (Cloudflare et consorts) de nombreux sites marchands. **Testé par l'utilisateur avec Claude Code, ne fonctionne pas** (l'IP Hostinger est également filtrée). Le code éventuellement déjà écrit pour ce relais est à retirer ou laisser de côté — ne pas poursuivre dans cette direction.

### Service de scraping tiers — ScrapingAnt (17 août 2026)

Décision retenue à la place : passer par ScrapingAnt (scrapingant.com), qui propose un palier gratuit permanent de 10 000 crédits/mois sans carte bancaire — suffisant pour démarrer sans frais, avec bascule vers un plan payant plus tard si le volume dépasse ce palier (pas à anticiper maintenant, même fournisseur, juste changer de plan).

- **Compte et clé API à créer par l'utilisateur lui-même** (Claude ne peut pas créer de compte à sa place) sur scrapingant.com, puis poser la clé en variable d'environnement Vercel (ex. `SCRAPINGANT_API_KEY`).
- Appel HTTP simple depuis la Server Action/Route Handler de scraping : `GET https://api.scrapingant.com/v2/general?url=<url encodée>&x-api-key=<clé>&browser=false`. Le paramètre `browser=false` est important : il évite le rendu JavaScript (inutile ici, JSON-LD/Open Graph sont déjà présents dans le HTML servi par la plupart des sites marchands) et ne consomme qu'1 crédit par requête au lieu de 10 — ça fait la différence entre ~10 000 et ~1 000 scrapes gratuits par mois.
- La réponse est le HTML de la page cible : **ne pas dupliquer la logique de parsing**, continuer à passer ce HTML dans `parseArticleMetadata` (`lib/scrape-article.ts`), source unique déjà en place.
- Fallback inchangé : si l'appel à ScrapingAnt échoue (crédits épuisés, timeout, erreur), retomber sur le comportement actuel (fetch direct depuis Vercel, puis champ vide si ça échoue aussi) — le formulaire doit toujours rester utilisable manuellement, ne jamais bloquer l'ajout d'un article.

## Réservation d'article par un invité (tâche #17)

- Bouton "Réserver" visible sur `/liste/[slug]` uniquement si `status = 'disponible'` et `mode != 'cotisation_obligatoire'`.
- Pour les articles en `cotisation_obligatoire`, ou déjà en `status = 'cagnotte'` : pas de bouton d'action pour l'instant, juste le badge de statut — la cotisation arrive avec la tâche #18, ne pas construire une UI de cotisation par anticipation.
- Formulaire invité minimal déclenché par le clic : prénom/nom (obligatoire), email (optionnel, sert à prévenir en cas d'annulation future).
- L'écriture ne passe jamais par un appel RPC direct depuis le navigateur : un Route Handler / Server Action utilise le client `service_role` (`lib/supabase/admin.ts`) pour appeler `reserve_gift_item`. Ça permet de garder une validation et une éventuelle limitation de fréquence côté serveur.
- Gérer proprement l'échec de la fonction (article déjà réservé entre-temps par quelqu'un d'autre, cas de double-clic simultané) avec un message clair à l'invité plutôt qu'une erreur brute.
- Synchronisation temps réel : la page publique s'abonne aux changements de `gift_items` via Supabase Realtime (`postgres_changes` sur UPDATE, filtré par `event_id`) pour refléter en direct une réservation faite par un autre invité pendant la consultation, sans nécessiter un rechargement manuel — c'est le mécanisme anti-doublon prévu dès le cadrage initial.

## Cagnotte et frais (tâche #18)

Compte Stripe créé par l'utilisateur, Connect activé en mode **marketplace** (le modèle Kdovie correspond à ce cas Stripe : la plateforme collecte puis reverse à plusieurs bénéficiaires organisateurs, avec commission au passage — pas le cas "plateforme SaaS" où chaque compte connecté encaisse pour son propre compte). Clés de test posées en variables d'environnement Vercel : `STRIPE_SECRET_KEY` (`sk_test_...`) et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_...`, préfixe obligatoire pour l'exposition côté navigateur). Rester en mode test tant que le statut juridique (tâche #8, toujours en cours) n'est pas réglé — ne pas basculer en clés live avant.

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

Recadrage produit du 16 août 2026 : le type d'événement est devenu optionnel sur une liste (voir section "Recadrage" ci-dessus) — migration `0004_events_type_optional.sql` écrite (à appliquer manuellement via le SQL Editor Supabase, comme `0003`), `NouvelEvenementForm` et les fallbacks `eventTypeIcon`/`eventTypeLabel` mis à jour.

Nouvelle notion du 16 août 2026 : statut brouillon/ouverte par liste (voir section "Statut de liste" ci-dessus) — migration `0005_events_status.sql` écrite (à appliquer manuellement via le SQL Editor Supabase, comme `0003` et `0004`), bouton réversible "Ouvrir ma liste aux invités" sur la page de gestion, gating du contenu sur `/liste/[slug]` et badges de statut sur le dashboard et la page de gestion développés.

Tableau de bord `/compte` refait depuis la maquette Claude Design `Compte.dc.html` : statistiques du compte, cartes de mise en avant (ajout rapide de cadeau, liste simple), cartes d'événement avec barre de progression et encart cagnotte, fil d'activité (réservations et cotisations récentes). La création d'événement reste sur sa page dédiée `/compte/evenements/nouveau` (pas de formulaire inline dupliqué sur le dashboard, conformément aux routes déjà actées).

Page "Mon compte" du 16 août 2026 : route `/compte/profil` développée (voir section "Page 'Mon compte'" ci-dessus) — pseudo éditable (`profiles.display_name`), email en lecture seule, déconnexion. Le bloc "Mon compte" du dashboard est maintenant un lien vers cette page.

Page publique `/liste/[slug]` refaite depuis la maquette Claude Design `Liste publique.dc.html` : bannière d'en-tête avec compteur de cadeaux encore libres (mis à jour en temps réel), grille de cartes (image ou pastille de couleur, badge disponible/réservé/en cagnotte, barre de progression pour les cagnottes), réservation via une modale (au lieu du formulaire inline précédent — `ReservationBlock` supprimé, sa logique fusionnée dans `ListePubliqueClient`), page "liste introuvable" dédiée (`not-found.tsx` du segment, remplace la 404 générique de Next.js) pour un slug inexistant, états dédiés "pas encore ouverte" et "encore vide". Point laissé de côté à l'époque : la maquette affiche le pseudo de l'organisateur dans la ligne meta ("liste de tlachat") — non repris alors, faute de policy RLS publique sur `profiles`. Tranché le 17 août 2026 (voir section "Pseudo public sur la page liste" ci-dessus) : à implémenter.

Page de gestion `/compte/evenements/[slug]` refaite depuis la maquette Claude Design `Gestion liste.dc.html`, et modification/suppression des articles (voir section "Gestion des articles par l'organisateur" ci-dessus) développées en même temps :
- Migration `0006_gift_items_lock_edit_delete.sql` écrite (à appliquer manuellement via le SQL Editor Supabase, comme les précédentes) : étend le trigger `protect_gift_item_mode` pour bloquer aussi title/price_cents/image_url une fois `status != 'disponible'`, et ajoute un trigger `gift_items_protect_delete` équivalent pour le delete.
- Nouvelles actions serveur `updateGiftItem`/`deleteGiftItem`.
- `AjouterArticleForm` réorganisé en deux onglets (Par lien / Saisie manuelle). Mise à jour du 17 août 2026 (décision utilisateur) : le lien produit n'est plus demandé en saisie manuelle — migration `0007_gift_items_source_url_optional.sql` (pas encore appliquée) rend `gift_items.source_url` nullable, il reste obligatoire uniquement dans l'onglet "Par lien". Dans l'onglet "Par lien", les champs titre/prix/image/précisions n'apparaissent qu'après avoir cliqué sur "Récupérer le cadeau" (avant, ils étaient visibles d'emblée dans les deux onglets).
- Nouveau composant `GiftItemCard` : lecture / édition / confirmation de suppression, verrouillage en lecture seule avec le nom de l'invité qui a réservé (via `reservations.guest_name`) une fois `status != 'disponible'`. Le sélecteur de mode (`ModeSelect`) reste séparé de l'édition, comme précisé dans le cadrage.
- Point laissé de côté délibérément : le bouton "Réglages de la liste" de la maquette n'a pas de comportement défini (ni dans le mock, ni ailleurs dans le produit) — non repris.

Maquette `Gestion liste.dc.html` mise à jour le 16 août 2026 : la maquette a évolué pour intégrer le statut brouillon/ouverte dans une carte "visibilité" dédiée avec QR code (via `api.qrserver.com`, service tiers, cohérent avec l'esprit MVP plutôt que d'ajouter une dépendance de génération de QR code) — nouveau composant `VisibiliteListe` qui remplace `CopierLienButton`/`ToggleStatutButton` sur cette page (`ToggleStatutButton` supprimé, `CopierLienButton` reste utilisé sur le dashboard `/compte`). Le badge de statut brut a été retiré de la bannière : la carte de visibilité, plus explicite (pastille de couleur, texte, QR grisé en brouillon), en tient lieu. Bouton de fermeture renommé "Refermer la liste" (au lieu de "Repasser en brouillon"), reste la même action réversible actée dans "Statut de liste".

Maquette `Gestion liste.dc.html` mise à jour une seconde fois le 16 août 2026, avec plusieurs nouveautés développées dans la foulée :
- **Édition de l'événement** (nom, type, date) directement depuis la page de gestion — nouveau composant `EnTeteListe` (lecture/édition) et action serveur `updateEvent`. Ne redéfinit rien de l'existant : mêmes règles que la création (type facultatif, date facultative), RLS `events_update_own` déjà en place.
- **Champ "précisions" sur un cadeau** (taille, couleur, modèle…), affiché aux côtés du prix et éditable avec le reste. Utilise la colonne `gift_items.description`, déjà présente depuis la migration 0002 mais jamais exploitée jusqu'ici — aucune nouvelle migration nécessaire pour ce champ. La migration `0006` (pas encore appliquée) a été complétée pour verrouiller aussi `description` une fois l'article verrouillé, cohérent avec title/price/image.
- **Nom du réservataire flouté par défaut**, révélable d'un clic (garde un peu de surprise pour l'organisateur lui-même). Pour les cagnottes, pas de noms de contributeurs affichés : cette donnée n'existe pas encore (tâche #18 pas construite).
- **Montant de cagnotte affiché en euros réels** ("816,00 € sur 1 200,00 €") plutôt qu'en pourcentage seul.
- **Panneau "Inviter mes proches"** (chips d'e-mails, message personnalisable, bouton Envoyer) : implémenté visuellement à l'identique de la maquette, mais **sans envoi réel** — décision explicite de l'utilisateur (aucune intégration Resend n'existe encore dans le projet, et faire croire à un envoi qui n'a pas lieu aurait été trompeur). L'état "Invitation envoyée" est purement local/optimiste. À câbler pour de vrai quand l'envoi transactionnel sera cadré.
- Libellé de la nav "Mes événements" → "Voir toutes mes listes" ; badge verrouillé "Lecture seule" → "Non modifiable".

Pseudo public sur la page liste du 17 août 2026 (voir section dédiée ci-dessus) : migration `0008_profiles_public_display_name.sql` écrite (pas encore appliquée) — accès `anon` à `profiles` restreint aux colonnes `id`/`display_name` uniquement (revoke + grant colonne, pas juste une policy RLS), policy `profiles_select_public_display_name`. `/liste/[slug]` affiche désormais "liste de {pseudo}" dans la ligne meta quand le pseudo est renseigné, rien sinon.

Problème constaté en usage réel le 17 août 2026 : beaucoup de sites marchands bloquent les requêtes de scraping venant des IP Vercel/AWS (protection Cloudflare et consorts).

Piste Hostinger tentée puis abandonnée (voir section "Relais de scraping via Hostinger — abandonné" ci-dessus) : le sous-projet `scrape-relay/` avait été écrit et testé de bout en bout, mais l'offre Hostinger de l'utilisateur (Unlimited Web Hosting) ne supporte pas l'hébergement Node.js — confirmé via la doc officielle Hostinger, seuls Business Web Hosting et les paliers Cloud/VPS le permettent. Plutôt que de faire monter l'utilisateur en gamme, décision de passer directement à un service tiers. Code du relais retiré du repo (`scrape-relay/` supprimé, exclusion eslint retirée).

Service de scraping tiers ScrapingAnt développé, testé de bout en bout et opérationnel en production (voir section "Service de scraping tiers — ScrapingAnt" ci-dessus) :
- `app/compte/evenements/[slug]/scrape-action.ts` : tente ScrapingAnt en premier (`GET https://api.scrapingant.com/v2/general`, `browser=false`, avec une nouvelle tentative automatique sur une réponse 423 — ScrapingAnt recommande lui-même de réessayer dans ce cas) si `SCRAPINGANT_API_KEY` est définie, retombe sur le fetch direct (comportement historique) si la clé n'est pas configurée ou que l'appel échoue.
- `SCRAPINGANT_API_KEY` posée dans les variables d'environnement Vercel le 17 août 2026 — confirmé fonctionnel en production via les logs `[scrape]`.
- Testé avec la vraie clé sur des cas réels : succès sur Conforama (titre/prix/image extraits), échec ponctuel puis succès au réessai suivant sur ce même site. Sur l'ASIN Amazon testé tout au long de cette session, ScrapingAnt tombe souvent sur la page de vérification "cliquez pour continuer vos achats" — Amazon protège apparemment cet article précis plus agressivement que la moyenne.

**Escalade vers `browser=true` + `proxy_type=residential` tentée puis retirée (17 août 2026).** Implémentée et testée de bout en bout (paramètres confirmés via la doc ScrapingAnt et le client JS officiel, coût confirmé à 125 crédits/requête) : elle améliorait bien le taux de réussite sur Amazon, mais au prix d'une latence jugée inacceptable par l'utilisateur en usage réel (rendu navigateur + routage résidentiel prend naturellement 9 à 25 secondes, contre le quasi-instantané attendu). **Retirée sur retour explicite de l'utilisateur** ("beaucoup trop lent... presque instantané") — `git revert` propre du commit correspondant. Ne pas réintroduire une escalade de ce type sans repenser l'UX (par exemple : hors du chemin critique du formulaire, en tâche de fond avec notification, plutôt qu'un blocage synchrone de "Récupérer le cadeau"). L'app reste donc sur le seul mode simple (`browser=false`, quasi instantané) + repli direct, avec le compromis assumé : moins fiable sur les sites très protégés type Amazon, mais rapide partout.

Nettoyage de l'URL avant scraping (17 août 2026, retour d'usage de l'utilisateur) : `scrapeArticleUrl` retire les paramètres de requête (`?...`) et le fragment (`#...`) de l'URL produit avant de tenter le scraping (ScrapingAnt puis fetch direct) — une URL "propre" (juste le chemin) scrape sensiblement mieux en pratique, sans doute parce que les paramètres de tracking/session/affiliation rendent la page plus suspecte aux yeux des protections anti-bot. L'URL d'origine (avec ses paramètres) reste ce qui est enregistré comme `source_url` du cadeau — seule celle utilisée pour la requête de scraping est nettoyée, le lien conservé pour les invités et la future génération de lien d'affilié (tâche #19) n'est pas modifié. Vérifié par test isolé (mécanique de nettoyage) et de bout en bout (Conforama, avec des `utm_*`/`sessionid` ajoutés à l'URL).

Spinner de chargement (17-18 août 2026, voir section "Identité visuelle" ci-dessus) : import de la maquette Claude Design "Logo animé.dc.html", nouveau composant `components/ui/KdovieSpinner.tsx`, posé sur les 8 boutons à état d'attente de l'app. Retouché deux fois sur retour d'usage (agrandi via `scale` sur le SVG interne, sans agrandir la boîte prise en compte par la mise en page du bouton parent — actuellement `scale-[2]`).

Cagnotte Stripe Connect développée de bout en bout (tâche #18, 18 août 2026) :
- Migration `0009_events_fee_mode.sql` (colonne `events.fee_mode`, défaut `frais_en_sus`) et `0010_organizer_stripe_accounts_public_status.sql` (ouvre la colonne `payouts_enabled` — uniquement elle, pas `stripe_account_id`/`organizer_id` — à `anon`, pour l'état "cagnotte en validation" côté invité) écrites, pas encore appliquées à la base distante — à faire manuellement via le SQL Editor Supabase, comme les précédentes (`0003` à `0008` toujours en attente elles aussi).
- Onboarding Stripe Connect Express sur `/compte/profil` (`StripeStatusCard`, action serveur `startStripeOnboarding`) : crée le compte connecté au premier clic, redirige vers l'Account Link hébergé, statut (non connecté / en attente / actif) rafraîchi en direct côté serveur tant que `payouts_enabled` n'est pas vrai en base.
- Formulaire de cotisation invité sur `/liste/[slug]` (`ContributionModal`) : montant libre ou suggéré, détail des frais affiché en direct selon `fee_mode` de l'événement (formule exacte de la section "Cagnotte et frais" ci-dessus, dans `lib/fee-calculation.ts`, partagée client/serveur). "Je réserve" et "Je cotise" peuvent maintenant coexister sur un même article en mode `auto` (le premier geste d'un invité verrouille toujours le mode, cohérent avec la règle de gestion actée).
- Paiement via Stripe Elements (Payment Element), PaymentIntent créé côté serveur (`app/liste/[slug]/contribution-actions.ts`) avec `application_fee_amount` (commission Kdovie 1 %) et `transfer_data.destination` **+ `on_behalf_of`** vers le compte Connect de l'organisateur — le `on_behalf_of` est nécessaire pour que les frais de traitement Stripe soient portés par l'organisateur et non par la plateforme (sinon Stripe les prélève par défaut sur le solde de la plateforme, ce qui contredirait "les frais Stripe ne sont pas absorbés par Kdovie").
- Webhook `app/api/webhooks/stripe/route.ts` : vérifie la signature (corps brut, `STRIPE_WEBHOOK_SECRET`), appelle `confirm_contribution` via `service_role` sur `payment_intent.succeeded`. Échec de la RPC (ex. article verrouillé en réservation directe par un autre invité entre-temps) loggé plutôt qu'avalé silencieusement, pour un traitement manuel du cas rare où l'argent a déjà transité côté Stripe sans confirmation côté app.
- État "cagnotte en validation" : badge sur la carte d'article (page publique) et message dans le formulaire de cotisation quand le compte Stripe de l'organisateur n'est pas encore vérifié — la cotisation reste possible, seul le reversement est différé.
- Testé en clés de test Stripe à chaque étape (appels réels à l'API : création de compte Connect Express, génération d'Account Link, création de PaymentIntent avec `on_behalf_of`/`transfer_data`, signature de webhook via `Stripe.webhooks.generateTestHeaderString`) et visuellement (rendu du formulaire de cotisation dans ses trois états). Reste à tester en conditions réelles une fois les migrations `0009`/`0010` appliquées et `STRIPE_WEBHOOK_SECRET` créé côté utilisateur (endpoint Stripe Dashboard > Developers > Webhooks, ou `stripe listen` en local) — variable ajoutée vide dans `.env.local`, comme `RESEND_API_KEY`.

Onboarding Stripe Connect affiné après premiers tests en conditions réelles (18 août 2026) : l'utilisateur a testé le parcours organisateur et remonté que l'onboarding posait des questions orientées "entreprise" malgré des organisateurs tous particuliers. Deux correctifs dans `startStripeOnboarding` (`app/compte/profil/stripe-actions.ts`) :
- `business_type: "individual"` à la création du compte — évite l'écran de choix "particulier / entreprise" (sans ce champ, un compte de test créé pendant le diagnostic s'est retrouvé classé `company`, probablement par reconnaissance de la session Stripe du navigateur de l'utilisateur, déjà connectée à son compte entreprise réel).
- `business_profile` prérempli à la création (Stripe exige ce profil même pour un `individual`, sinon l'onboarding le redemande à l'écran) :
  - `mcc: "7299"` ("Services divers"). Code choisi après consultation de la liste officielle Stripe (docs.stripe.com/connect/setting-mcc) : le seul code explicitement lié au financement participatif est `8398` ("Charitable and Social Service Organizations - Fundraising"), écarté car il implique un statut d'organisme caritatif que les organisateurs Kdovie n'ont pas — risque d'être corrigé d'office par les contrôles de cohérence de Stripe ("Stripe doit vérifier que le MCC défini manuellement correspond bien au secteur d'activité du compte connecté"). `7299` est générique et honnête, un seul code suffit puisque tous les organisateurs ont la même activité (recevoir des cotisations cadeaux entre particuliers).
  - `url` : la liste publique de l'organisateur (`/liste/[slug]` de son événement le plus ancien) s'il en a déjà créé une, sinon le site Kdovie en repli — un particulier n'a pas de site pro à fournir.
  - `product_description` : "Cagnotte cadeau pour un événement personnel (naissance, mariage, anniversaire, etc.)".
- Testé à chaque correctif par appel réel à l'API Stripe (compte de test créé puis supprimé, `business_type`/`mcc`/`url` vérifiés sur la réponse). Deux comptes de test bloqués créés pendant le diagnostic (dont un classé `company` par erreur) supprimés côté Stripe et en base (`organizer_stripe_accounts`) pour repartir propre.

À venir, dans l'ordre : liens d'affiliation, bêta fermée, lancement. L'envoi réel des invitations par e-mail (Resend) est à cadrer séparément, pas dans cet ordre actuel.

## Workflow git

Fais un commit à chaque fois qu'une tâche du backlog (ou une fonctionnalité significative) est terminée et validée — pas un seul gros commit en fin de session. Message clair, en français, qui référence la tâche si pertinent (ex : "feat: ajout d'article multi-boutique avec scraping (#16)"). Ne commite jamais un état qui ne build pas ou dont les tests/lint échouent.

Le remote `origin` est configuré (https://github.com/thierrylachatpro/kdovie). Chaque `git push` doit être explicitement confirmé par l'utilisateur avant d'être exécuté — ne jamais pousser automatiquement sans demander, le commit local suffit à la fin d'une tâche.

## Mode de collaboration

L'utilisateur pilote le produit avec un chef de projet Claude dans une conversation séparée (cadrage, décisions business/design, arbitrages). Ce fichier est le résumé de ce qui a été décidé là-bas. Si une décision fonctionnelle ou business manque ici pour avancer, pose la question à l'utilisateur plutôt que de trancher seul — il pourra la reporter dans l'autre conversation pour que ce fichier soit mis à jour en conséquence.
