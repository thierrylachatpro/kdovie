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

- **Pas de renommage** *(décision initiale du 16 août — voir la mise à jour du 18 août dans "Terminologie : liste plutôt qu'événement" plus bas, qui la remplace pour les libellés UI uniquement)*. Le mot "événement" reste tel quel partout : table `events`, routes `/compte/evenements/...`, tous les libellés UI ("Vos événements", "Type d'événement"...). Seule la notion de date/type imposés change, pas la terminologie.
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
  4. Repli Amazon (17 août 2026, aucune page produit Amazon n'expose JSON-LD ni Open Graph) : `#productTitle` pour le titre, `#landingImage`/`#imgTagWrapperId img` (attribut `data-a-dynamic-image` ou `src`) pour l'image. ~~Pas de repli prix pour Amazon~~ **Repli prix réactivé le 20 août 2026** (voir "Prix Amazon réactivé" plus bas) : liste de sélecteurs scopés au conteneur du prix principal ("buybox"), plutôt que le sélecteur générique non scopé qui causait le problème initial.
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

## Bug frais Stripe absorbés par Kdovie au lieu de l'organisateur (19 août 2026)

Découvert en épluchant un vrai paiement de test sur le dashboard Stripe avec l'utilisateur : le détail d'une cotisation de 20,77 € ne montrait qu'une seule déduction, la commission Kdovie de 0,21 € (1 %) — aucune ligne pour les frais de traitement Stripe. Confirmé sur l'onglet "Frais perçus" du compte connecté : les 4 lignes correspondent exactement à 1 % de chaque paiement, rien d'autre.

**Cause identifiée, confirmée par la documentation Stripe officielle (`docs.stripe.com/connect/charges`)** : pour une **destination charge** (le type utilisé ici, via `transfer_data.destination`), Stripe prélève systématiquement ses propres frais de traitement sur le solde de la **plateforme**, quel que soit le réglage de `on_behalf_of` — citation exacte : *"Destination charges and separate charges and transfers typically use the platform's pricing plan and are assessed on the platform."* Le `on_behalf_of` change seulement le pays de règlement, le relevé bancaire, et le délai de versement — jamais qui paie les frais Stripe pour ce type de charge (seules les **direct charges** offrent ce choix). L'hypothèse posée dans la section "Cagnotte et frais" ci-dessus au moment de l'implémentation initiale était donc fausse.

**Conséquence financière concrète, vérifiée sur les 4 transactions de test** : Kdovie encaisse 1 % du montant prélevé via `application_fee_amount` (ex. 0,21 € sur 20,77 €), mais se fait ensuite prélever par Stripe des frais de traitement plus élevés (~0,56 € sur ce même paiement) directement sur le solde de la plateforme. **Résultat : Kdovie perd de l'argent sur chaque cotisation au lieu de gagner sa commission**, et l'organisateur reçoit plus que prévu (20,56 € au lieu des 20,00 € nets annoncés à l'invité).

**Piste de correction, à cadrer avant implémentation** (ne pas laisser Claude Code trancher seul, sujet financier) : `computeMontantOrganisateurCents` (`lib/fee-calculation.ts`) calcule déjà correctement ce que l'organisateur doit recevoir net. Le correctif le plus simple, sans changer de type de charge Stripe, consiste à envoyer à Stripe un `application_fee_amount` égal à `montantPreleveCents - computeMontantOrganisateurCents(montantPreleveCents)` (commission Kdovie + frais Stripe combinés) au lieu du 1 % seul actuellement envoyé dans `createContribution` (`app/liste/[slug]/contribution-actions.ts`) — la plateforme reçoit alors de quoi payer les frais Stripe qui lui seront prélevés et garde son vrai 1 % de marge, tandis que le compte connecté reçoit exactement le montant net déjà annoncé à l'invité. Alternative plus lourde : basculer sur des **direct charges**, qui permettent nativement de faire porter les frais Stripe par le compte connecté — pas retenue pour l'instant, changement d'architecture plus important pour un gain équivalent.

**Statut (19 août 2026) : corrigé et testé.** `createContribution` envoie désormais `application_fee_amount = montantPreleveCents - computeMontantOrganisateurCents(montantPreleveCents)`, exactement la piste ci-dessus. `computeApplicationFeeAmountCents`/`computeFraisStripeCents` inchangées, toujours utilisées telles quelles pour le détail des frais affiché à l'invité (`ContributionModal`), non concerné par ce bug.

Testé de bout en bout en clés de test Stripe :
- Formule vérifiée par script pour les deux `fee_mode` (généralise sans condition particulière, `computeMontantOrganisateurCents` se calculant à partir de `montantPreleveCents` dans les deux cas) : `frais_en_sus` (net 20,00 € → prélevé 20,77 € → `application_fee_amount` 0,77 €) et `frais_deduits` (net 20,00 € → prélevé 20,00 € → `application_fee_amount` 0,75 €).
- Test complet via l'app réelle (pas une réimplémentation du calcul) : `createContribution` appelé directement, vraie Checkout Session créée, paiement simulé jusqu'au bout par navigateur automatisé avec une carte de test. Le `PaymentIntent` résultant confirme `amount: 2077` / `application_fee_amount: 77`, exactement la valeur attendue. Vérifié sur le solde du compte connecté (`balanceTransactions.list` avec `stripeAccount`) : chaque paiement de 2077 apparaît avec `fee: 77`, `net: 2000` — l'organisateur reçoit désormais exactement le montant net annoncé à l'invité, plus aucun surplus.
- Webhook déclenché automatiquement par Stripe vers la prod (`kdovie.vercel.app`, déjà déployée) pendant ce test, confirmant `confirm_contribution` sans intervention manuelle — bon signe pour le pipeline complet, mais a aussi révélé au passage que `confirm_contribution` (fonction Postgres existante, hors périmètre de cette tâche) n'est pas idempotente : un second appel sur une contribution déjà `succeeded` réincrémente `funded_amount_cents` une deuxième fois. Repéré en rappelant la fonction manuellement par erreur pendant le test (webhook déjà passé par la prod) — état de test restauré à l'identique ensuite, mais à garder en tête si un rejeu de webhook Stripe survient un jour en conditions réelles.

**Point résiduel soulevé puis résolu (19 août 2026)** : sur cette transaction de test et sur un test ultérieur fait par l'utilisateur lui-même (10,00 € net → 10,51 € prélevés → 0,58 € de frais Stripe réels), le frais réellement prélevé dépassait largement l'hypothèse `TAUX_STRIPE = 0.015` (1,5 % + 0,25 €) — taux réel reconstitué à partir des deux transactions : **3,12 %**, quasi identique aux 3,15 % + 0,25 € que Stripe facture publiquement pour les "cartes internationales" (hors UE/UK). **Cause identifiée et confirmée par un test dédié** : la carte de test générique `4242 4242 4242 4242` utilisée dans les deux tests simule une carte **américaine** (confirmé par la doc officielle Stripe, `docs.stripe.com/testing`), donc facturée au tarif international plutôt qu'au tarif domestique UE. Un test refait avec la carte française dédiée (`4000 0025 0000 0003` / `pm_card_fr`) sur un montant de 10,51 € donne un frais réel de 0,41 €, quasi identique aux 0,4077 € prédits par `TAUX_STRIPE = 0.015` + 0,25 € — **hypothèse confirmée correcte, `TAUX_STRIPE` inchangée**. Le "déficit" observé était un artefact de la carte de test utilisée, pas un bug ni un mauvais taux dans le code. Pour tout futur test dont les montants doivent tomber juste, utiliser `pm_card_fr`/`4000 0025 0000 0003`, jamais `4242 4242 4242 4242`.

## Bug idempotence `confirm_contribution` (19 août 2026)

Découvert incidemment pendant le test du correctif frais Stripe (voir section précédente) : un webhook Stripe `checkout.session.completed` a atteint la prod pendant le test, `confirm_contribution` a ensuite été rappelée manuellement par erreur sur la même contribution — `funded_amount_cents` a été réincrémenté une seconde fois pour un seul paiement réel.

**Cause** : la fonction (`0002_events_gift_items.sql`) ne vérifie pas le statut de la contribution avant d'appliquer l'incrément — elle repasse `contributions.status` à `succeeded` et fait `gift_items.funded_amount_cents = funded_amount_cents + amount_cents` inconditionnellement, à chaque appel. Stripe documente explicitement qu'un même événement webhook peut être livré plusieurs fois (retry réseau, timeout côté récepteur) — ce n'est pas un cas exotique, le code doit le tolérer.

**Correctif** : nouvelle migration `0016_confirm_contribution_idempotent.sql`, `create or replace function public.confirm_contribution` avec une vérification en tête — si `v_contribution.status = 'succeeded'` déjà, retourner l'état actuel de `gift_items` sans réappliquer l'incrément ni retoucher `locked_at`. Pas de changement de signature, pas de changement d'appelant (`app/api/webhooks/stripe/route.ts` continue d'appeler la fonction telle quelle).

**Statut : corrigé, appliqué et testé.** Migration `0016_confirm_contribution_idempotent.sql` appliquée à la base distante. Testé par un vrai appel RPC (pas une réimplémentation) : une contribution de test insérée en base, `confirm_contribution` appelée deux fois de suite sur le même `p_contribution_id` — le premier appel incrémente `funded_amount_cents` de 1500 (le montant de test) et verrouille l'article en `cagnotte`, le second appel renvoie le même état sans réincrément (`funded_amount_cents` reste à 1500, pas 3000). État de test restauré à l'identique ensuite.

## Emails transactionnels (19 août 2026)

Chantier absent du périmètre construit jusqu'ici : le panneau "Inviter mes proches" existe visuellement (`/compte/evenements/[slug]`) mais n'envoie rien de réel (décision explicite du 16 août, voir plus haut). Au-delà de ça, aucun email n'est envoyé nulle part dans le produit sauf le lien magique de connexion, géré nativement par Supabase Auth avec un template générique.

**Fournisseur déjà tranché** : Resend (voir "Stack technique" en tête de fichier). `RESEND_API_KEY` réservée vide dans `.env.local` depuis le début du projet, jamais encore renseignée.

**Approche technique recommandée**, à confirmer/ajuster à l'implémentation plutôt qu'à figer ici dans le détail :
- Templates en React via `@react-email/components` (même éditeur que Resend, s'intègre nativement à `resend.emails.send`) plutôt que du HTML écrit à la main — cohérent avec le stack Next.js/React déjà en place, évite de maintenir deux systèmes de templating.
- Un composant de mise en page partagé (en-tête avec logo Kdovie, palette chaleureuse déjà validée, pied de page avec liens légaux) réutilisé par tous les emails plutôt qu'un design par email — même logique que `PageLegale`/`LiensLegaux` pour les pages web.
- Domaine d'envoi à vérifier dans Resend (enregistrements DNS SPF/DKIM à poser chez Hostinger, même registrar que pour `kdovie.com` — voir la procédure déjà suivie pour pointer le domaine vers Vercel). Adresse d'expédition à définir, ex. `Kdovie <hello@kdovie.com>` — à ajuster librement à l'implémentation.
- Emails strictement transactionnels (déclenchés par une action précise d'un utilisateur) — pas de newsletter, pas de digest, pas de marketing. Hors périmètre pour l'instant.

**Compte Resend à créer par l'utilisateur** (Claude ne peut pas créer de compte à sa place), clé posée en variable d'environnement Vercel une fois obtenue — même schéma que `SCRAPINGANT_API_KEY`/`AMAZON_ASSOCIATE_TAG`.

### Périmètre de ce chantier : noyau essentiel d'abord

Décision du 19 août 2026 avec l'utilisateur : ne pas tout construire d'un coup. Ce chantier couvre uniquement les quatre emails ci-dessous ; le reste (liste complète plus bas) est explicitement reporté à un chantier ultérieur, à recadrer le moment venu.

1. **Lien magique de connexion** (organisateur) — migré de Supabase Auth vers Resend pour la cohérence visuelle avec la charte Kdovie, plutôt que laissé au template générique de Supabase. Mécanisme : un Auth Hook Supabase (« Send Email Hook ») intercepte l'envoi natif et délègue à une route Kdovie qui construit l'email et l'envoie via Resend — à valider précisément à l'implémentation, l'API exacte des Auth Hooks Supabase n'a pas été vérifiée en détail ici.
2. **Invitation à consulter une liste** (invité) — déclenché par le clic sur "Envoyer" dans le panneau "Inviter mes proches" existant. Nouvelle Server Action qui envoie un email par destinataire saisi (pas un envoi groupé en copie, pour ne pas exposer les adresses des uns aux autres) avec le lien de la liste et le message personnalisable déjà prévu dans l'UI. Remplace l'état "Invitation envoyée" actuellement purement optimiste par un vrai envoi.
3. **Confirmation de réservation** (invité) — déclenchée après un appel réussi à `reserve_gift_item`, uniquement si `guest_email` a été renseigné (facultatif, voir "Ajustements listes publique et gestion"). Contenu : nom du cadeau, lien "aller l'acheter" (via `getAffiliateLink` si applicable, cohérent avec la tâche #19).
4. **Confirmation de cotisation** (invité) — déclenchée dans le webhook Stripe juste après un appel réussi à `confirm_contribution`, uniquement si `contributions.guest_email` est renseigné. Vient **en plus** du reçu de paiement automatique envoyé nativement par Stripe Checkout (les deux ne sont pas exclusifs) — celui de Kdovie permet d'inclure le nom du cadeau et le lien affilié "aller l'acheter", ce que le reçu Stripe générique ne fait pas.

### Hors périmètre de ce chantier (backlog, à recadrer plus tard)

Emails identifiés mais pas construits maintenant, dans un ordre d'utilité approximatif, à retrancher/réordonner à la prochaine session de cadrage :
- Email de bienvenue à la création d'un compte organisateur.
- Notification à l'organisateur qu'un invité a réservé un article.
- Notification à l'organisateur qu'une cotisation a été reçue (montant, cumul de la cagnotte).
- Notification à l'organisateur qu'une cagnotte est intégralement financée.
- Rappel à l'organisateur si l'onboarding Stripe Connect reste inachevé après un délai.
- Confirmation à l'organisateur qu'un reversement (payout) a eu lieu.
- Rappel aux invités à l'approche de la date de l'événement, si `event_date` est renseignée.

**Statut : implémenté et testé dans la mesure du possible sans compte Resend actif (19 août 2026).**

Les 4 emails du noyau essentiel sont codés : `lib/resend.ts` (client, même schéma que `lib/stripe.ts`), `lib/send-email.ts` (`sendTransactionalEmail`, échec silencieux et loggé si `RESEND_API_KEY` absente ou si l'appel Resend échoue — jamais d'erreur bloquante pour la réservation/cotisation/connexion), `components/emails/EmailLayout.tsx` (mise en page partagée, palette Kdovie) + 4 templates (`LienMagiqueEmail`, `InvitationEmail`, `ReservationConfirmeeEmail`, `CotisationConfirmeeEmail`), branchés respectivement sur : `app/api/auth/send-email/route.ts` (Auth Hook Supabase), `app/compte/evenements/[slug]/invite-actions.ts` (`sendInvitations`, remplace l'état optimiste de `VisibiliteListe`), `app/liste/[slug]/reservation-actions.ts` (après `reserve_gift_item`), `app/api/webhooks/stripe/route.ts` (après `confirm_contribution`).

Point 5 (lien magique) confirmé faisable : l'Auth Hook Supabase « Send Email » a une API stable et documentée (payload signé `standardwebhooks`, réponse HTTP 200 obligatoire même en cas d'échec interne pour ne pas bloquer la connexion), compatible avec le flux PKCE déjà en place (`signInWithOtp` + `exchangeCodeForSession`) puisqu'il n'intercepte que la composition/l'envoi de l'email, pas le mécanisme d'auth. Implémenté plutôt qu'écarté.

**`@react-email/components` marqué "no longer supported" par npm à l'installation** (Resend a consolidé vers un nouveau package unifié `react-email` v6+). Gardé volontairement : le nouveau package a des problèmes rapportés spécifiquement sur Vercel (taille de bundle +~80 Mo par fonction, déploiements qui restent bloqués silencieusement) alors que `@react-email/components` reste fonctionnel. Pas une faille de sécurité, une consolidation d'offre — à surveiller, pas urgent.

**Dette technique à reprendre plus tard (pas oubliée)** : migrer de `@react-email/components` vers le nouveau package unifié `react-email` v6+, une fois les rapports de bugs Vercel (bundle/déploiements bloqués) résolus côté Resend — à vérifier avant de s'y remettre, ne pas migrer tant que ce n'est pas confirmé stable sur Vercel.

**Testé réellement** : `npx tsc --noEmit`, `npm run lint`, `npm run build` propres (route `/api/auth/send-email` bien générée). Rendu des 4 templates vérifié visuellement (route de preview temporaire + capture d'écran Playwright, supprimée ensuite) — tous conformes à la charte, aucune erreur de rendu. Route `/api/auth/send-email` testée avec une charge utile signée synthétique (secret de test temporaire, `standardwebhooks` en local pour signer côté script comme le fait Supabase) : signature vérifiée avec succès, payload parsé, réponse 200 — confirme que la vérification cryptographique et le parsing fonctionnent de bout en bout côté Kdovie.

**Statut (19 août 2026) : les 4 emails du noyau essentiel sont en production et fonctionnels.** Compte Resend créé, `RESEND_API_KEY` posée sur Vercel, domaine `kdovie.com` vérifié. Hook Supabase « Send Email » activé (Auth > Hooks → `https://kdovie.vercel.app/api/auth/send-email`, secret posé dans `SUPABASE_SEND_EMAIL_HOOK_SECRET`) — lien magique testé en conditions réelles par l'utilisateur, fonctionnel. Plus aucune étape bloquante côté utilisateur pour ce chantier.

### Retouches sur les 4 templates après premier retour d'usage (19 août 2026)

- **Invitation** : objet dynamique `"{pseudo organisateur} vous envoie sa liste de cadeaux"` (repli `"On vous envoie une liste de cadeaux"` si aucun pseudo renseigné — même règle de non-fuite que le pseudo public sur `/liste/[slug]`), construit dans `sendInvitations` plutôt que dans le template. Message par défaut du panneau "Inviter mes proches" (`VisibiliteListe.tsx`) réécrit ; le template (`InvitationEmail`) préserve désormais les retours à la ligne (`whiteSpace: "pre-line"`) plutôt que du HTML brut dans un textarea en clair.
- **Confirmation de réservation et de cotisation** : objet et corps utilisent désormais `truncateTitle` (`lib/gift-item.ts`, coupe sur une limite de mot à ~60 caractères) — filet de sécurité pour les titres non raccourcis au scraping (saisie manuelle, articles anciens antérieurs au raccourcissement automatique du 18 août). Bouton principal ("Aller l'acheter" / "Voir le cadeau") passé du style secondaire (crème) au style principal (corail), cohérent avec le bouton de l'email d'invitation. Les deux précisent désormais sur quelle liste porte l'action ("sur la liste « X »").
- **Expéditeur** changé de `hello@kdovie.com` à `contact@kdovie.com` (`lib/resend.ts`) — la boîte `hello@` n'existe pas réellement, `contact@kdovie.com` est à la fois la boîte que l'utilisateur a effectivement créée chez Hostinger et l'adresse déjà utilisée dans les mentions légales/CGV.

### Annulation de réservation par l'invité (19 août 2026)

Nouvelle fonctionnalité, absente du périmètre initial des emails transactionnels — ajoutée à la demande de l'utilisateur en même temps que la confirmation de réservation, dont elle prolonge le lien "Annuler ma réservation". Concerne uniquement les réservations directes, jamais les cotisations (l'argent a déjà transité via Stripe, non annulable dans ce flux).

- **Migration `0017_cancel_reservation.sql`** (appliquée à la base distante le 19 août 2026) : nouvelle fonction `cancel_reservation(p_reservation_id uuid)` security definer (même schéma que `reserve_gift_item`/`confirm_contribution`) — pose `reservations.cancelled_at`, repasse `gift_items.status` à `disponible` (et `locked_at` à `null`) si l'article était bien encore au statut `reserve`. La colonne `cancelled_at` existait déjà dans le schéma d'origine (migration 0002) mais n'était utilisée nulle part jusqu'ici. La contrainte unique d'origine sur `reservations.gift_item_id` (un seul review par article) est remplacée par un index unique **partiel** (`where cancelled_at is null`), sans quoi une réservation annulée bloquerait indéfiniment toute nouvelle réservation sur le même article. `lib/supabase/types.ts` mis à jour à la main pour inclure cette fonction (même pratique que pour `is_priority`/`deleted_at`/`is_admin`, déjà présents dans les types avant l'application de leurs migrations respectives).
- **Lien d'annulation** dans l'email de confirmation de réservation : `${SITE_URL}/liste/[slug]/annuler/[reservationId]` — le token de sécurité est l'UUID de la réservation elle-même (non-devinable, jamais affiché ailleurs), même logique de "capacité par URL secrète" qu'un lien de désinscription classique, pas de compte invité à créer.
- **Nouvelle page publique** `/liste/[slug]/annuler/[reservationId]` (server component, pas de JS client nécessaire) : affiche le nom du cadeau et un bouton de confirmation (formulaire lié à une Server Action, pas de suppression sur un simple GET — un scanner de liens dans un client email ne doit jamais déclencher l'annulation). État "réservation introuvable/déjà annulée" si l'UUID ne correspond à rien ou si `cancelled_at` est déjà renseigné.
- **`app/liste/[slug]/cancel-reservation-actions.ts`** (`cancelReservation`) : appelle `cancel_reservation` via le client `service_role`, revalide les deux pages concernées, redirige vers `/liste/[slug]?annulation=succes`. `ListePubliqueClient` affiche un bandeau de confirmation sur ce paramètre, même mécanique que les retours `?cotisation=succes/annulee` de Stripe Checkout.
- **Testé** : build/tsc/lint propres ; rendu visuel vérifié par capture d'écran pour les deux états de la page (introuvable, et réservation active) ; `truncateTitle` vérifié unitairement sur plusieurs titres réels de la base. **Statut (19 août 2026) : flux complet validé en conditions réelles par l'utilisateur** (vraie réservation, annulation via le lien reçu par email, article revenu à `disponible`) — migration `0017` appliquée, plus rien de bloquant sur cette fonctionnalité.

## Email de bienvenue organisateur (19 août 2026)

Premier chantier du backlog "hors périmètre" listé dans la section "Emails transactionnels"
ci-dessus. Décision avec l'utilisateur sur le reste du backlog de cette section, à ne pas
redébattre :

- **Notifications organisateur (réservation reçue / cotisation reçue / cagnotte financée à
  100 %) : écartées, pas seulement reportées.** Contraires à la mécanique déjà en place ailleurs
  dans le produit (réservations et cotisations floutées par défaut, révélables seulement d'un
  clic — voir "Ajustements listes publique et gestion" ci-dessous) : l'organisateur est censé
  garder la surprise jusqu'à l'événement, une notification immédiate casserait ça. Ne pas
  reproposer ces 3 emails sans en rediscuter explicitement.
- **Rappel onboarding Stripe inachevé, confirmation de payout, rappel avant l'événement** :
  toujours au backlog, mais chantier à part — contrairement aux emails déjà construits
  (déclenchés par une action immédiate), ces 3-là nécessitent un déclenchement différé/planifié
  (cron), pas juste un événement applicatif.

**Implémentation** : email envoyé à la toute première connexion réussie d'un organisateur (pas à
la création du compte au sens strict — l'auth.users est créé dès la demande du lien magique,
avant toute vérification que l'email est bien le sien).

- **Migration `0018_profiles_welcome_email_sent_at.sql`** (écrite, pas encore appliquée à la base
  distante) : nouvelle colonne `profiles.welcome_email_sent_at` (timestamptz, nullable). Choix
  délibéré plutôt qu'une heuristique sur `created_at`/`last_sign_in_at` du user Supabase (peu
  fiable selon le délai entre la demande du lien et son clic, et le Send Email Hook existant —
  qui intercepte déjà le lien magique lui-même — ne se déclenche qu'à la demande du lien, pas à
  la confirmation qu'il a été utilisé). `lib/supabase/types.ts` mis à jour à la main, même
  pratique que pour les colonnes des migrations précédentes pas encore appliquées.
- **`app/auth/callback/route.ts`** (`envoyerBienvenueSiPremiereConnexion`, appelée juste après un
  `exchangeCodeForSession` réussi, avant la redirection) : `update profiles set
  welcome_email_sent_at = now() where id = ... and welcome_email_sent_at is null returning id` via
  le client `service_role` — atomique et idempotent, un rejeu du callback (double clic, retour
  arrière du navigateur) ne renvoie jamais l'email deux fois. Si la ligne revient (première fois),
  envoi de l'email ; sinon rien. Comme les autres emails transactionnels, une erreur ici est
  loguée et avalée, ne bloque jamais la connexion.
- **`components/emails/BienvenueEmail.tsx`** : même `EmailLayout`/`emailStyles` que les 4 emails
  existants. Contenu volontairement court — la valeur du compte permanent multi-événements, le
  rappel que les proches n'ont pas besoin de compte, et **le rappel que les réservations restent
  floutées** (cohérent avec la décision ci-dessus d'avoir écarté les notifications immédiates) —
  puis un bouton vers la création de la première liste et un renvoi vers `/aide`.
- **Testé** : `tsc`/`lint` propres. **Pas testé en conditions réelles** : bloqué tant que la
  migration `0018` n'est pas appliquée à la base distante (comme les migrations précédentes en
  attente).

## Ajustements listes publique et gestion (18 août 2026)

Série de retouches décidées après les premiers tests réels de la cagnotte, sur `/liste/[slug]` (page publique) et `/compte/evenements/[slug]` (gestion) :

**Priorité (organisateur uniquement)** : nouveau champ `gift_items.is_priority` (boolean, défaut `false`), réglable uniquement depuis la page de gestion — jamais visible ni signalé côté invité sur `/liste/[slug]`. Contrairement à title/price/image/description, ce champ n'est **pas** verrouillé par le trigger existant : l'organisateur peut le modifier même une fois l'article réservé/en cagnotte, puisque ça ne touche à aucune règle métier côté invité, juste à son propre classement visuel.

**Tri des articles (public et gestion, même logique des deux côtés)** :
1. D'abord tous les articles `is_priority = true` qui ne sont **pas** "terminés" (terminé = cagnotte finalisée ou article réservé) — tout en tête de liste, devant même les articles non-prioritaires disponibles. À l'intérieur de ce sous-groupe, garder l'ordre du point 2 ci-dessous.
2. Puis les articles non-prioritaires (ou prioritaires mais terminés — la priorité ne s'applique plus une fois terminé), dans cet ordre :
   - cadeaux non réservés (réservation directe possible, y compris les articles en mode `automatique` n'ayant encore reçu aucune action — même s'ils pourraient aussi recevoir une cotisation, ils comptent ici)
   - cagnottes non démarrées (mode `cotisation_obligatoire`, ou `automatique`, avec `funded_amount_cents = 0` — distinctes du groupe précédent uniquement par le fait qu'aucune réservation directe n'est possible dessus)
   - cagnotte démarrée (`status = 'cagnotte'`, `funded_amount_cents < price_cents`)
   - cagnotte finalisée (`status = 'cagnotte'`, `funded_amount_cents >= price_cents`)
   - cadeaux réservés (`status = 'reserve'`)

**Fond blanc vs atténué** : les 3 premiers groupes de la liste ci-dessus (non réservés, cagnottes non démarrées, cagnotte démarrée) restent sur fond blanc — tout ce qui reste actionnable pour un invité. Cagnotte finalisée et cadeaux réservés passent sur un fond atténué (non blanc), pour signaler visuellement "déjà réglé".

**Affichage du montant de cagnotte** : remplacer le texte "X % réunis" par le montant réel, ex. "150,00 € sur 500,00 €" — cohérent avec ce qui existe déjà côté gestion, à appliquer aussi sur la page publique. La barre de progression visuelle reste inchangée (toujours calculée en %, seul le texte à côté change).

**Floutage des participants, y compris cagnotte** : côté gestion uniquement, étendre le floutage déjà en place sur le nom du réservataire (révélable d'un clic) aux noms des contributeurs d'une cagnotte — même traitement pour les deux. Rien de tout ça côté page publique : un invité ne voit jamais aucun nom (ni le sien après action, ni ceux des autres), comportement déjà en place à ne pas changer.

**Titre de l'article cliquable** : sur les deux pages, le titre ouvre `source_url` dans un nouvel onglet (`target="_blank" rel="noopener noreferrer"`). Si `source_url` est vide (article en saisie manuelle, migration 0007), le titre reste simple texte, non cliquable.

**Après une réservation confirmée** : proposer un lien/bouton vers `source_url` (page produit chez le marchand) pour que l'invité puisse aller l'acheter — seulement si `source_url` est renseignée.

**Prénom/nom de l'invité devient optionnel** (réservation et cotisation) : aujourd'hui `not null` en base sur `reservations.guest_name` et `contributions.guest_name` — nouvelle migration pour rendre les deux colonnes nullable. Quand vide, afficher "Anonyme" partout où un nom serait montré (y compris une fois "révélé" via le floutage ci-dessus).

**Suppression de copie** : retirer la phrase "L'organisateur ne verra pas votre choix avant l'événement" du parcours de réservation/cotisation invité.

## Raccourcissement automatique du titre scrapé (18 août 2026)

Constat : certains sites (Amazon en particulier, mais pas uniquement) renvoient des titres produit très longs, bourrés de mots-clés SEO ("TV gratuite et en direct, télécommande vocale Alexa, alimentation via votre TV, configuration facile..."). Ça alourdit l'affichage partout où le titre apparaît (cartes, fil d'activité du dashboard, description de la ligne Stripe Checkout). Un raccourcissement automatique est nécessaire, en plus de (pas à la place de) la modification manuelle déjà possible.

- **Nouvelle colonne `gift_items.original_title`** (text, nullable) — conserve le titre brut tel que scrapé, pour un rappel au survol (voir plus bas). Reste `null` pour un article en saisie manuelle (rien à raccourcir, l'organisateur tape déjà son propre titre).
- **Heuristique de raccourcissement**, appliquée uniquement côté scraping (onglet "Par lien"), avant que le titre ne préremplisse le formulaire :
  1. Si le titre contient un séparateur assez tôt (" : " ou " | ", fréquent chez Amazon — le vrai nom du produit précède souvent) et que la portion avant ce séparateur fait entre ~15 et ~90 caractères, couper là.
  2. Sinon, tronquer à ~60 caractères sur une limite de mot (jamais couper au milieu d'un mot), en ajoutant "…".
  3. Le titre raccourci devient la valeur de `gift_items.title` (celle utilisée partout dans l'app) ; le titre brut original va dans `original_title`.
- **Titre complet accessible via "voir plus" (18 août 2026, révisé)** : pas d'infobulle native (`title=""`) — support erratique en lecteur d'écran (JAWS l'ignore sous Chrome/Firefox/Edge, doublon possible avec le nom accessible sous NVDA) en plus d'être inaccessible au clavier et au tactile. À la place, partout où le titre raccourci est affiché avec un `original_title` non vide, terminer par un contrôle "… voir plus" qui déplie le titre complet en place (dans la carte, sans élément flottant à positionner), avec un contrôle "réduire" pour revenir à la version courte. Exigences d'accessibilité, non négociables pour que ce soit un vrai progrès et pas juste un déplacement du problème :
  - Un vrai `<button type="button">`, jamais un `<span>`/`<a>` avec seulement `onClick` — focusable au clavier nativement, activable par Entrée/Espace sans JS supplémentaire.
  - `aria-expanded={déplié}` sur ce bouton, pour que l'état soit annoncé par les lecteurs d'écran.
  - Libellé accessible explicite sur l'action, pas seulement "…" visuel — ex. `aria-label="Afficher le titre complet"` / `"Réduire le titre"`, ou texte visible équivalent.
  - Composant réutilisable, état local simple (déplié/replié), pas de dépendance ajoutée. Rien à afficher si `original_title` est vide (article en saisie manuelle ou déjà assez court).
- **Pas rétroactif** : ne s'applique qu'aux nouveaux articles ajoutés à partir de maintenant. Les articles déjà en base ne sont pas retouchés — l'organisateur peut toujours les raccourcir à la main via l'édition existante s'il le souhaite.
- Le titre raccourci reste modifiable manuellement comme aujourd'hui (`GiftItemCard`) — ce raccourcissement automatique est un point de départ, pas une valeur figée.

**Statut (18 août 2026)** : les deux morceaux sont développés. Composant "voir plus" — `components/gift-items/TitreArticle.tsx` (bouton natif, `aria-expanded`, libellé accessible explicite, jamais imbriqué dans le `<a>` du lien produit), posé sur `GiftItemCard` et la carte de `ListePubliqueClient`. Heuristique de raccourcissement — `shortenTitle` dans `lib/scrape-article.ts` (fonction pure, testée unitairement sur des titres réels de la base : Echo Show 5, Fire TV Stick, aspirateur — coupe au séparateur ou troncature au mot le plus proche selon le cas), appliquée dans `scrape-action.ts` juste après `parseArticleMetadata`, propagée via un champ caché `original_title` dans `AjouterArticleForm` (vidé si l'organisateur bascule sur l'onglet "Saisie manuelle") jusqu'à `createGiftItem`. Migration `0013_gift_items_original_title.sql` écrite, pas encore appliquée à la base distante — le raccourcissement automatique et le bouton "voir plus" n'auront donc d'effet visible qu'une fois la migration passée.

## Bloc "Ma cagnotte" sur /compte/profil (18 août 2026)

Renommer le titre du bloc Stripe Connect de "Cagnotte Stripe" à **"Ma cagnotte"**. Réécrire le texte d'explication pour clarifier, simplement et de façon rassurante, qu'un compte chez Stripe (notre partenaire de paiement) est nécessaire pour recevoir l'argent des cagnottes directement et en sécurité — ton chaleureux cohérent avec le reste du produit, pas de jargon technique (pas de "KYC", pas de "Connect Express").

## Suppression des fils d'ariane (18 août 2026)

Retirer les liens "← Retour à ..." (ex. "Retour à vos listes", "Retour au tableau de bord") sur toutes les pages du compte organisateur — la navigation du header suffit déjà, ce lien redondant est à supprimer partout où il apparaît.

## Terminologie : "liste" plutôt qu'"événement" (18 août 2026)

Décision qui remplace le choix du 16 août ("pas de renommage", voir section "Recadrage" plus haut) — mais seulement pour les **libellés visibles par l'utilisateur**, pas pour la couche technique :

- **Change** : tous les textes UI visibles ("Vos événements" → "Vos listes", "Type d'événement" → "Type de liste", "Nouvel événement" → "Nouvelle liste", "Mes événements" dans la nav → "Mes listes", etc.) — à passer en revue sur tout le produit, sauf si un terme reste plus juste dans son contexte précis (ex. "Anniversaire" reste un type de liste, pas à renommer).
- **Ne change pas** : le nom de la table `events`, les segments de route `/compte/evenements/...`, les noms de fichiers/variables/fonctions dans le code — renommer la couche technique serait un chantier disproportionné (migration de schéma, réécriture des routes) pour un gain purement cosmétique côté utilisateur. Cette couche interne reste "événement", conformément au principe "sauf si vraiment justifié" évoqué par l'utilisateur.

## Suppression d'une liste par l'organisateur (18 août 2026)

Nouvelle fonctionnalité, absente du périmètre initial. Contrairement à la fermeture d'une liste (`status = 'brouillon'`, réversible par l'organisateur, voir "Statut de liste" plus haut), la suppression est un **soft delete** : rien n'est jamais retiré en base, ni pour une liste vierge ni pour une liste avec de l'activité réelle (réservations, cotisations déjà payées via Stripe) — seule sa visibilité change. Ça évite le problème d'un hard delete sur des lignes `contributions` qui représentent de l'argent réellement transféré (traçabilité comptable, gestion d'un chargeback Stripe a posteriori).

- **Nouvelle colonne `events.deleted_at`** (timestamptz, nullable), indépendante de `status` (brouillon/ouverte garde son sens fonctionnel propre, la suppression est une dimension à part par-dessus). Nouvelle migration, ne pas mélanger avec une migration existante.
- **Déclenchée par l'organisateur**, sans condition sur l'activité de la liste (avec ou sans réservation/cotisation) — pas de distinction de cas à gérer côté UI/action serveur, `deleted_at` se pose dans tous les cas.
- **Dashboard organisateur (`/compte`)** : filtre `deleted_at is null`, une liste supprimée disparaît immédiatement de sa vue, comme n'importe quelle liste normale qui n'existerait plus pour lui.
- **Page publique `/liste/[slug]`** : si `deleted_at` est renseigné, basculer sur l'écran "liste introuvable" déjà existant (`not-found.tsx` du segment) — pas sur l'écran "pas encore ouverte", qui reste réservé au cas `status = 'brouillon'`. Un invité avec un ancien lien ne doit voir aucune différence entre "jamais existé" et "supprimée".
- **Slug retiré définitivement** : une fois une liste supprimée, son slug ne redevient jamais disponible pour une nouvelle liste — évite qu'un lien déjà partagé à des invités pointe un jour vers un contenu totalement différent. Contrainte à faire respecter à la création d'un événement (le check d'unicité de slug doit porter sur tous les événements, supprimés ou non, pas seulement sur `deleted_at is null`).
- **Irréversible pour l'organisateur** : il n'a lui-même aucun moyen de restaurer une liste supprimée — contrairement au toggle brouillon/ouverte. Seul le super-administrateur peut la lui rendre visible à nouveau (voir ci-dessous).
- **`gift_items`/`reservations`/`contributions`** : aucune colonne ni trigger à toucher, ces lignes restent intactes et inchangées, seule la liste parente devient invisible.

### Dashboard super-administrateur

- **Rôle admin** : nouvelle colonne `profiles.is_admin` (boolean, défaut `false`) plutôt qu'une simple vérification d'email codée en dur côté serveur — posée dès maintenant même s'il n'y a qu'un seul compte admin (le tien) aujourd'hui.
- **Nouvelle route protégée**, réservée aux comptes `is_admin = true` (vérification serveur, redirection ou 404 sinon) — emplacement à trancher à l'implémentation (ex. `/admin`), pas encore décidé dans le détail ici.
- **Périmètre pour cette tâche** : lister/consulter les listes supprimées (celles avec `deleted_at` renseigné, tous organisateurs confondus) **et** un bouton pour les restaurer (remet `deleted_at` à `null`, la liste redevient visible dans le dashboard de son organisateur d'origine). Pas de périmètre plus large pour l'instant (pas de vue globale sur tous les comptes/toutes les listes non supprimées, pas de statistiques) — à étendre plus tard si besoin s'en fait sentir.
- Lecture/écriture depuis cette route à faire via le client `service_role` (comme `reserve_gift_item`/`confirm_contribution`), avec le check `is_admin` fait côté serveur avant tout accès — jamais une policy RLS ouverte à `authenticated` sur les listes d'autrui.

## Liens d'affiliation (tâche #19, 18 août 2026)

Périmètre de lancement tranché avec l'utilisateur : **Amazon Associates uniquement** (amazon.fr — cohérent avec le marché français de Kdovie ; les autres places Amazon comme .com/.de ont des comptes Associates distincts, hors périmètre pour l'instant). Awin (Fnac et les autres enseignes du programme) reporté à plus tard. Les marchands sans programme détecté gardent un lien direct vers `source_url`, comme aujourd'hui.

- **Compte à créer par l'utilisateur** sur Amazon Partenaires (amazon.fr) — Claude ne peut pas créer de compte à sa place — pour obtenir un identifiant de suivi (tag, ex. `kdovie-21`). Clé posée en variable d'environnement Vercel, ex. `AMAZON_ASSOCIATE_TAG`, même schéma que `SCRAPINGANT_API_KEY`. Tant qu'elle n'est pas définie, lien direct utilisé sans erreur (repli déjà en place ailleurs dans le produit).
- **Mécanisme** : ajout du paramètre `tag=<AMAZON_ASSOCIATE_TAG>` à l'URL produit — pas de service tiers, pas de wrapper de redirection (contrairement à Awin, qui utilisera un lien de redirection le jour où il sera ajouté). Détection par nom de domaine (`amazon.fr` uniquement pour l'instant, pas les autres TLD Amazon — programme Associates distinct par marketplace).
- **Calculé à l'affichage, jamais stocké en base** : pas de nouvelle colonne sur `gift_items`. Le lien se génère à chaque rendu de page à partir de `source_url` (déjà stocké tel quel, sans les paramètres nettoyés au scraping — voir "Nettoyage de l'URL avant scraping" plus haut, qui ne concerne que la requête de scraping, pas ce qui est stocké). Cohérent avec la note déjà actée dans "Points d'attention techniques" ci-dessous (rafraîchir plutôt que générer une fois) — vrai par construction ici, rien n'est mis en cache.
- **Fonction pure partagée**, ex. `lib/affiliate-link.ts`, `getAffiliateLink(sourceUrl: string): string` — retourne l'URL avec le tag ajouté si le domaine est reconnu, sinon `sourceUrl` inchangée. Extensible plus tard (nouvelle entrée de config par domaine/programme) sans réécrire les appelants.
- **Uniquement sur les surfaces invité**, jamais côté organisateur : le titre cliquable et le lien "Aller l'acheter" sur `/liste/[slug]` passent par `getAffiliateLink`. Le titre cliquable sur `/compte/evenements/[slug]` (gestion) continue de pointer vers `source_url` brute — pas d'intention d'achat de l'organisateur sur sa propre liste, pas de raison de complexifier ce lien.
- **Conformité programme** (règle déjà actée dans le périmètre MVP : pas de redirection automatique, pas d'iframe, attribut nofollow) : ces liens restent de vrais `<a target="_blank">` déclenchés par un clic invité, jamais une redirection serveur automatique ni un iframe. `rel` passe de `noopener noreferrer` à `sponsored noopener noreferrer` sur les liens effectivement affiliés (valeur `sponsored`, recommandée pour les liens rémunérés, en plus de `noopener noreferrer`) — uniquement quand `getAffiliateLink` a transformé le lien, pas sur un lien direct sans programme reconnu.
- **Mention de transparence**, à côté des liens concernés sur `/liste/[slug]` : un texte court type "lien affilié — Kdovie peut percevoir une commission, sans coût supplémentaire pour vous". Pas encore tranché précisément en amont — texte à proposer à l'implémentation plutôt qu'à deviner définitivement, l'utilisateur pourra ajuster.

**Hors périmètre pour cette tâche** : Awin (Fnac et les autres enseignes du programme), toute autre place Amazon que `.fr`, une éventuelle interface d'administration pour gérer plusieurs programmes/identifiants — pas à anticiper maintenant, la fonction pure/config le permettra sans réécriture profonde le moment venu.

## Pages légales : mentions légales, CGU, CGV (18 août 2026)

Déclenché par l'obligation Amazon Partenaires de mentionner "En tant que Partenaire Amazon, je réalise un bénéfice sur les achats remplissant les conditions requises" sur le site — mention distincte de celle déjà en place à côté de chaque lien affilié (`ListePubliqueClient.tsx`), qui elle reste où elle est (exigence de visibilité au moment du clic, ne peut pas être déplacée sur une page à part).

- **Trois pages nouvelles**, liées depuis le pied de page sur tout le site : `/mentions-legales`, `/cgu`, `/cgv`.
- **Identité de l'éditeur** (Prowebia, SASU au capital de 500 €, SIREN 992 497 891, RCS Amiens, siège 15 Rue du Bois 80540 Clairy-Saulchoix, président Thierry Lachat, TVA intracommunautaire FR18992497891) confirmée à partir du Kbis et des statuts constitutifs — Kdovie tourne sous cette même structure, pas d'entité à part.
- **Objet social à surveiller** : les statuts actuels ne mentionnent explicitement aucune activité de plateforme d'intermédiation/cagnotte — zone grise plutôt que blocage, mais une modification statutaire (décision de l'associé unique seul, cf. article 18 des statuts) est recommandée avant un vrai volume de cotisations. Action côté utilisateur, pas de dépendance technique.
- **RC Pro (MAIF) à étendre** : l'activité déclarée est "formateur en informatique / développeur / audit", pas la gestion d'une plateforme avec cotisations entre tiers — à signaler à l'assureur. Action côté utilisateur.
- **Contenu rédigé** : voir le brouillon partagé en conversation (mentions légales et CGU rédigés en premier jet, CGV volontairement laissé en page "en cours de rédaction" tant que le statut juridique — TVA déjà connue, mais médiation de la consommation non souscrite, politique de remboursement des cotisations et applicabilité du droit de rétractation encore à trancher — n'est pas stabilisé).
- **Hors périmètre pour cette tâche** : une politique de confidentialité RGPD dédiée (distincte des CGU) est nécessaire mais pas encore rédigée — à traiter séparément.
- Email de contact dans les mentions légales et le CGV : `contact@kdovie.com`.

## Backlog produit : pages "À propos", "Aide" (19 août 2026)

Constaté en vérifiant la cohérence de la page d'accueil : le pied de page (`components/accueil/AccueilClient.tsx`) contient des liens "À propos" et "Aide" qui ne mènent nulle part (`href="#"`), en plus des trois pages légales déjà construites (mentions légales, CGU, CGV) et du lien "Confidentialité" — celui-ci restera un lien mort tant que la politique de confidentialité RGPD elle-même n'est pas rédigée (déjà noté comme hors périmètre dans "Pages légales" ci-dessus). Décision du 19 août 2026 : reporté, à recadrer plus tard (contenu à définir : une vraie page "À propos", une FAQ/aide dédiée ou un renvoi vers `contact@kdovie.com`) — ne pas construire ces pages sans en rediscuter d'abord.

## Refonte mobile de la page publique (20 août 2026)

Import du mockup Claude Design "Liste publique mobile v2.dc.html" (projet "Kdovie, plateforme de listes cadeaux"), implémenté uniquement pour l'affichage mobile — le desktop (`sm:` et plus, ≥640px) reste rigoureusement inchangé. Les deux versions cohabitent dans le même DOM via des classes `sm:hidden`/`hidden sm:flex` plutôt qu'une détection JS de la largeur d'écran (évite tout mismatch d'hydratation).

- **`app/liste/[slug]/page.tsx`** : en-tête responsive (logo 30px au lieu de 38px, sous-titre "Un seul compte..." masqué, padding resserré) — uniquement le bloc logo, `NavConnecte` inchangé (hors périmètre de ce mockup, qui ne modélise pas le cas organisateur connecté).
- **`components/gift-items/ListePubliqueClient.tsx`** : bloc de résumé de liste et grille de cartes entièrement dupliqués en deux versions (desktop inchangée, mobile nouvelle) plutôt que fusionnés avec des classes conditionnelles ligne à ligne — les deux présentations sont trop différentes (cartes en ligne blanches vs cartes plein format avec photo/dégradé) pour partager un seul balisage sans complexifier inutilement. Les deux versions itèrent le même tableau `sorted` (tri, priorité, floutage identiques) et calculent les mêmes variables d'état par article (`canReserve`/`canContribute`/`isTaken`/`rienDisponible`) — seule la présentation change, aucune divergence fonctionnelle entre les deux tailles d'écran.
- **Cartes mobiles, révisées une seconde fois (v3, toujours le 20 août 2026)** : la première version ("poster", v2 — photo plein format en fond, dégradé sombre, texte clair en surimpression) a été remplacée par une carte plus classique, plus proche du langage visuel desktop — bandeau photo/teinte de secours à hauteur fixe (230px) en haut, contenu en dessous sur fond blanc avec texte sombre (titre `#4A3529`, prix `#C0512A`), barre de cagnotte en vert sauge au lieu du jaune. Seule la mise en page verticale distingue encore vraiment le mobile du desktop, plus la palette de couleurs. Les 4 états réels du produit (réserver, cotiser, déjà réservé, cagnotte pas encore possible faute de compte Stripe) restent identiques à la version desktop, inchangés par cette révision — seul l'habillage de la carte a changé, pas la logique ni les props qu'elle consomme.
- **Modales (réservation et cotisation)** : passent en feuille ("bottom sheet") sur mobile — ancrées en bas de l'écran, coins arrondis uniquement en haut, poignée de glissement — via des classes `sm:` sur le même composant plutôt qu'un doublon, le contenu du formulaire étant identique aux deux tailles.
- **Écarts corrigés par rapport au mockup**, ce dernier datant d'avant plusieurs décisions produit plus récentes déjà actées dans ce fichier — implémenté avec le comportement réel, pas celui du mockup :
  - Le champ e-mail du formulaire de réservation reprenait l'ancien texte ("Uniquement pour recevoir la confirmation...") — remplacé par le texte actuel sur l'annulation de réservation (voir "VisibiliteListe" plus haut).
  - La phrase "L'organisateur ne verra pas votre choix avant l'événement" avait été retirée du parcours invité le 18 août — pas réintroduite.
  - Le paragraphe de pied de page du mockup ("Une réservation par erreur ? Écrivez à Thierry...") nommait l'organisateur en dur et décrivait un contact manuel par e-mail — supprimé : l'app sert plusieurs organisateurs différents (pas seulement Thierry), et l'annulation en libre-service par lien e-mail existe déjà (voir "Annulation de réservation par l'invité", 19 août 2026).
  - Le mockup ne modélise pas le `mode`/statut Stripe des articles (toutes ses cotisations sont de simples affichages non cliquables) — la version implémentée réutilise la vraie logique `canReserve`/`canContribute` déjà en place, y compris le bouton "Je cotise" fonctionnel (pas un texte de remplissage).

**Testé** : `tsc`/`lint`/`build` propres. Rendu vérifié par capture d'écran à 390px (liste, les deux modales) et à 1280px (non-régression desktop, pixel identique à avant) avec des données bouchon couvrant les 4 états (disponible + prioritaire, réservé, cagnotte en cours, cotisation obligatoire) — tri et logique de bouton confirmés corrects sur les deux tailles.

## Backlog produit : QR code imprimable et personnalisé (20 août 2026)

Reporté, à ne pas commencer maintenant — noté suite à une discussion sur la meilleure façon pour un organisateur de diffuser le lien de sa liste. Conclusion de cette discussion : l'email d'invitation et le lien copié restent le canal principal (déjà construits), le QR code (`VisibiliteListe.tsx`, généré aujourd'hui via `api.qrserver.com`, affiché en HTML uniquement) prend surtout sa valeur comme pont vers le support physique — faire-part, affichette posée sur une table le jour J. Trois pistes identifiées pour mieux servir cet usage, à recadrer plus précisément le moment venu :

- **QR code imprimable** : aujourd'hui juste affiché à l'écran, pas d'export en bonne résolution. Ajouter un moyen de le télécharger (PNG/SVG) en qualité suffisante pour une impression sur un faire-part ou une affichette, pas seulement pour un écran.
- **Logo Kdovie au centre du QR code** : `api.qrserver.com` ne le permet pas nativement — nécessiterait soit un autre service, soit une génération maison (ex. librairie `qrcode` + overlay du logo canonique en niveau de correction d'erreur élevé pour rester scannable).
- **Mockup marketing du QR code glissé entre la coque et le téléphone** : pas une fonctionnalité du produit lui-même, mais un visuel illustrant un usage concret (le QR imprimé en petit format, glissé derrière la coque, toujours à portée de main pour le montrer/le faire scanner sans ouvrir l'app) — utile pour une image de communication (ex. post LinkedIn/Instagram via le skill `community-manager`) plutôt que pour le code du produit.

## Dashboard super-administrateur — CRUD organisateurs (20 août 2026)

Extension du dashboard admin existant (`/admin`, listes supprimées) avec un CRUD organisateurs, sur demande explicite de l'utilisateur. Deux points tranchés avec lui avant l'implémentation, à ne pas redébattre :

- **Pas de création de compte depuis ce dashboard.** Un organisateur se crée toujours lui-même via le lien magique, comme aujourd'hui.
- **Pas de suppression réelle depuis ce dashboard.** À la place, une désactivation réversible (`profiles.disabled`, migration `0019_profiles_disabled.sql`, pas encore appliquée à la base distante) qui bloque la connexion sans rien supprimer. `cleanup-organizer.mjs` reste le seul moyen de suppression réelle et irréversible, réservé à un usage manuel en ligne de commande.

**Implémentation** :
- **`app/admin/organisateurs/page.tsx`** : même garde-fou que `/admin` (`isCurrentUserAdmin()`, 404 sinon). Liste tous les `profiles` (via `service_role`) croisés avec `supabase.auth.admin.listUsers({ perPage: 1000 })` pour récupérer email et dernière connexion (absents de `profiles`, uniquement dans `auth.users`) — une seule page de 1000 comptes maximum pour cette première version, pas de pagination : à revoir si le nombre d'organisateurs dépasse ce seuil un jour, pas un problème à l'échelle actuelle (bêta fermée).
- **`app/admin/organisateurs/actions.ts`** : `updateOrganizerPseudo` (édite `profiles.display_name`) et `setOrganizerDisabled` (bascule `profiles.disabled`) — même pattern que `restoreEvent` (`app/admin/actions.ts`) : re-vérification `is_admin` dans l'action elle-même, jamais confiée au seul gate de la page, écriture via `service_role`. `setOrganizerDisabled` refuse qu'un admin se désactive lui-même (vérifié par comparaison d'UUID), pour ne pas se retrouver bloqué à sa propre connexion suivante.
- **`components/admin/OrganisateurCard.tsx`** : une carte par organisateur (email, pseudo ou "Sans pseudo", date d'inscription, dernière connexion, badges "Admin"/"Désactivé"), édition du pseudo en ligne (même schéma que `EnTeteListe`), désactivation/réactivation avec confirmation en deux temps (même schéma que `SupprimerListeButton`, adapté puisque réversible ici).
- **Application du blocage** : vérifié dans `app/auth/callback/route.ts`, juste après `exchangeCodeForSession` — c'est le seul point de passage obligé pour obtenir une session (contrairement au Send Email Hook, qui n'intercepte que l'envoi du lien et ne bloquerait pas un lien déjà reçu avant la désactivation). Si `profiles.disabled = true`, déconnexion immédiate (`auth.signOut()`) et redirection vers `/connexion?erreur=compte_desactive`, message dédié dans `ConnexionForm.tsx`. **Limite connue, acceptable pour cette première version** : une session déjà active au moment de la désactivation n'est pas coupée en cours de route par ce mécanisme — seule la connexion suivante est bloquée.
- Pas de gestion de `profiles.is_admin` depuis cette interface (promotion/rétrogradation) — reste une opération manuelle en base, cohérent avec la décision déjà actée dans la section "Suppression d'une liste par l'organisateur" ci-dessus ("Aucun moyen de devenir admin depuis l'app").

**Testé** : `tsc`/`lint`/`build` propres. Rendu vérifié par capture d'écran avec des données bouchon (liste, édition de pseudo, confirmation de désactivation) — conforme. **Statut migration (20 août 2026)** : `0019_profiles_disabled.sql` appliquée sur les deux bases, `profiles.disabled` confirmée présente par requête REST directe sur la base de dev (`hvyinuoebkzghrbcbnqa`, historique de migration réparé via `supabase migration repair` après une première application manuelle par l'utilisateur via le SQL Editor) et sur la base de prod (`ppsaiaesnvwnkzjisvdr`). **Pas encore testé en conditions réelles** : le dashboard `/admin/organisateurs` lui-même (liste, édition de pseudo, désactivation) et le blocage de connexion dans le callback n'ont pas été exercés contre de vraies données/un vrai compte — la colonne existe, mais le flux complet reste à vérifier.

## Refonte du dashboard super-administrateur (20 août 2026)

Demande explicite de l'utilisateur : le dashboard `/admin` existant (listes supprimées + bascule
maintenance) et `/admin/organisateurs` (CRUD organisateurs, voir "Dashboard super-administrateur —
CRUD organisateurs" ci-dessus) restent la base, mais l'ensemble doit devenir une vraie interface
avec navigation latérale, un écran de synthèse, et une nouvelle section cotisations. Toujours
réservé à `profiles.is_admin = true`, même garde-fou qu'aujourd'hui (404 si non-admin, re-vérifié
dans chaque action serveur — jamais confié au seul gate de la page).

### Navigation

Nouvelle mise en page partagée (`app/admin/layout.tsx`) avec une colonne de gauche fixe, 4
entrées :
- **Organisateurs** → `/admin/organisateurs` (existant, inchangé dans son contenu)
- **Listes** → `/admin/listes` (nouvelle page, remplace le contenu actuel de `/admin` qui ne
  montrait que les listes *supprimées* — voir "Section Listes" ci-dessous)
- **Cotisations** → `/admin/cotisations` (nouvelle page, voir "Section Cotisations" ci-dessous)
- **Bouton "Maintenance"** : pas un lien vers une page à part, un vrai bouton dans la colonne qui
  ouvre `MaintenanceToggle` (déjà développé, `components/admin/MaintenanceToggle.tsx`) en place
  (popover ou petite modale) — une pastille de couleur sur le bouton reflète l'état actuel
  (en ligne / en maintenance) sans avoir à l'ouvrir.

Le check `isCurrentUserAdmin()` (404 sinon) doit passer dans ce layout partagé plutôt que d'être
répété dans chaque `page.tsx` comme aujourd'hui — simplifie chaque page, sans rien changer à la
re-vérification systématique côté actions serveur (`app/admin/actions.ts`,
`app/admin/organisateurs/actions.ts`, et les nouveaux fichiers d'actions ci-dessous).

`/admin` (racine) devient l'écran de synthèse ci-dessous, plus une simple redirection vers les
listes supprimées.

### Écran de synthèse (nouvel `/admin`, avant de cliquer sur un item de la colonne)

Proposition de contenu (à ajuster librement à l'implémentation, l'utilisateur n'avait pas figé la
liste exacte) — des tuiles de stats groupées en 3 blocs, toutes calculables directement à partir
du schéma existant :

- **Organisateurs** : nombre total inscrits, nouveaux aujourd'hui, nouveaux sur les 7 derniers
  jours (`profiles.created_at` ou `auth.users.created_at`).
- **Listes** : nombre total, répartition ouvertes/brouillon, nouvelles sur les 7 derniers jours
  (`events.created_at`, `deleted_at is null`).
- **Réservations** : nombre total, sur les 7 derniers jours (`reservations.created_at`,
  `cancelled_at is null`).
- **Cotisations** : nombre de cotisations réussies (total et 7 derniers jours), montant total
  cotisé en euros (`sum(amount_cents) where status = 'succeeded'`, total et 7 derniers jours), et
  commission Kdovie cumulée (1 % théorique, via la même fonction pure que celle qui sert
  aujourd'hui au détail des frais affiché à l'invité dans `lib/fee-calculation.ts` — à vérifier
  précisément son nom exact à l'implémentation, pas relu dans le détail ici).
- **Comptes Stripe organisateurs** : répartition actif / en attente / aucun
  (`organizer_stripe_accounts.payouts_enabled`, cohérent avec `OrganizerStripeStatus` déjà utilisé
  ailleurs) — utile pour anticiper combien de bandeaux "Bandeau d'incitation à activer sa cagnotte
  Stripe" (voir section ci-dessous) sont actuellement affichés aux organisateurs.

### Section Listes (`/admin/listes`)

Remplace le contenu actuel de `/admin` (qui ne montrait que les listes supprimées) par une vue sur
**toutes** les listes, tous organisateurs confondus :

- **Filtre** en haut de la page, champ texte unique cherchant à la fois sur le nom de la liste et
  l'email de l'organisateur (même embedding `profiles(display_name)` déjà utilisé dans l'actuel
  `app/admin/page.tsx`, complété par un croisement avec `admin.auth.admin.listUsers()` pour
  l'email, même pattern que `app/admin/organisateurs/page.tsx`).
- **Lien pré-filtré depuis la page Organisateurs** : sur chaque `OrganisateurCard`
  (`components/admin/OrganisateurCard.tsx`), ajouter un bouton/lien vers
  `/admin/listes?q=<email de l'organisateur>` — arrive directement sur la vue Listes filtrée pour
  cet organisateur précis.
- **Désactiver** : bascule `events.status` entre `ouverte`/`brouillon` depuis l'admin — même
  mécanisme que le bouton "Fermer la liste"/"Ouvrir ma liste aux invités" déjà côté organisateur
  (`updateEventStatus`), juste actionnable aussi par un admin sur la liste de n'importe qui.
- **Supprimer, définitivement** : **décision explicite de l'utilisateur (20 août 2026, tranchée
  après clarification)** — contrairement à la suppression organisateur (`deleteEvent`, soft delete
  via `deleted_at`, gardée pour sa traçabilité comptable sur les cotisations Stripe), la
  suppression **depuis l'admin est un vrai `DELETE` en base**, irréversible, y compris pour les
  `gift_items`/`reservations`/`contributions` liés (cascade déjà en place sur les FK, voir
  migrations 0001/0002). Assumé en connaissance de cause : ça peut faire perdre la trace
  comptable d'une cotisation Stripe réellement encaissée sur cette liste. Vu la gravité,
  confirmation renforcée nécessaire — au minimum le nom de la liste à retaper pour confirmer (pas
  un simple "Oui" comme les autres confirmations en deux temps du produit), et un avertissement
  explicite si la liste a des cotisations `succeeded` liées (ex. "Cette liste a reçu 42,00 € de
  cotisations réelles — la suppression effacera aussi cette trace comptable.").
- **Prévisualiser le contenu, même si la liste n'est pas active** : depuis cette vue, un lien vers
  `/liste/[slug]` doit fonctionner pour l'admin même si `status = 'brouillon'` ou même si
  `deleted_at` est renseigné (aujourd'hui bloqué par `notFound()`/l'écran "pas encore ouverte" pour
  tout le monde, voir `app/liste/[slug]/page.tsx`). Nécessite d'ajouter un contrôle
  `estAdminViewer` (via `isCurrentUserAdmin()`) sur cette page, au même endroit que le
  `estProprietaire` déjà calculé pour `NavConnecte` — bypass du gating `estOuverte`/`deleted_at`
  uniquement pour un admin, en lecture seule comme un invité normal (pas d'injection de contrôles
  d'admin sur cette page publique). Prévoir un petit badge visuel discret ("Vue admin — liste non
  ouverte au public" ou équivalent) pour que ce ne soit jamais confondu avec ce qu'un vrai invité
  voit.

### Section Cotisations (`/admin/cotisations`)

Nouvelle page, liste toutes les `contributions` (`status = 'succeeded'` par défaut, envisager un
badge de statut si utile d'afficher aussi pending/failed — à l'appréciation de l'implémentation) :

- **Colonnes** : montant cotisé, qui a cotisé (`guest_name`/`guest_email`, "Anonyme" si vide comme
  partout ailleurs dans le produit), commission Kdovie réelle à 1 % (la part Kdovie pure, pas
  `application_fee_amount` tel qu'envoyé à Stripe aujourd'hui — celui-ci inclut aussi les frais
  Stripe reversés à la plateforme depuis le correctif du 19 août, voir "Bug frais Stripe absorbés
  par Kdovie" — recalculer la part 1 % seule avec la même fonction pure que le détail affiché à
  l'invité), liste/liste concernée, organisateur.
- **Filtre** en haut, même principe que la section Listes : un champ texte cherchant à la fois côté
  organisateur (nom/email) et côté invité cotisant (nom/email).
- Requête : `contributions` avec embedding vers `gift_items(title, events(name, organizer_id))`
  (même syntaxe d'embedding Supabase déjà utilisée dans `app/admin/page.tsx` pour
  `profiles(display_name)`), puis croisement avec `admin.auth.admin.listUsers()` pour l'email de
  chaque organisateur, même pattern que `app/admin/organisateurs/page.tsx`.

**Statut : implémenté et testé dans la mesure du possible (20 août 2026).**

- `app/admin/layout.tsx` porte désormais l'unique garde-fou `isCurrentUserAdmin()` (404 sinon) pour
  tout `/admin/*` ; retiré des `page.tsx` individuels (`organisateurs`, nouvel `listes`, nouveau
  `cotisations`, racine) — inchangé côté Server Actions, qui re-vérifient toutes indépendamment
  (`app/admin/actions.ts`, `app/admin/organisateurs/actions.ts`, nouveau
  `app/admin/listes/actions.ts`).
- `components/admin/AdminSidebar.tsx` : colonne de gauche fixe (empilée en haut sur mobile),
  3 liens (Organisateurs/Listes/Cotisations) + bouton "Maintenance" avec pastille d'état, qui ouvre
  `MaintenanceToggle` dans un popover plutôt qu'une page à part — `MaintenanceToggle` a reçu un
  prop `onChange` optionnel pour que la pastille de la colonne reste synchronisée sans dupliquer
  l'appel serveur. `setMaintenanceMode` revalide désormais `/admin` en mode `"layout"` (pas juste
  la page) pour que cette pastille reste juste sur toutes les sous-pages au prochain chargement.
- `/admin` (racine) : entièrement réécrite en écran de synthèse (tuiles de stats organisées en
  5 groupes — organisateurs, listes, réservations, cotisations, comptes Stripe — plutôt que 3, la
  liste exacte n'ayant pas été figée dans le cadrage). L'ancien contenu (listes supprimées
  uniquement) est remplacé, pas redirigé : il vit maintenant entièrement dans `/admin/listes`, qui
  montre toutes les listes (pas seulement les supprimées). `components/admin/RestaurerButton.tsx`
  devenu inutile a été supprimé (sa logique est réintégrée dans `ListeAdminCard`).
- `/admin/listes` (`app/admin/listes/page.tsx` + `actions.ts` + `components/admin/ListeAdminCard.tsx`)
  : filtre texte (nom de liste ou email organisateur) via `?q=`, lien pré-filtré ajouté sur chaque
  `OrganisateurCard` ("Voir ses listes"). Bascule ouverte/brouillon (`updateEventStatusAdmin`),
  restauration des listes supprimées (réutilise `restoreEvent`), et suppression **réelle et
  irréversible** (`deleteEventPermanently`, vrai `DELETE`, pas `deleted_at`) avec confirmation
  renforcée : le nom exact de la liste doit être retapé (vérifié aussi côté serveur, pas seulement
  désactivé côté UI), et un avertissement dédié s'affiche si la liste a des cotisations
  `succeeded` liées, avec le montant réel.
- `/admin/cotisations` (`app/admin/cotisations/page.tsx`) : tableau de toutes les cotisations
  réussies, filtre texte (organisateur ou invité) via `?q=`, commission Kdovie recalculée à la
  vraie part 1 % (`computeApplicationFeeAmountCents` sur le montant prélevé reconstitué via
  `computeMontantPreleveCents(amount_cents, fee_mode)` — pas `application_fee_amount` tel
  qu'envoyé à Stripe, qui inclut aussi les frais Stripe depuis le correctif du 19 août).
- `app/liste/[slug]/page.tsx` : nouveau contrôle `estAdminViewer` (via `isCurrentUserAdmin()`),
  au même endroit que `estProprietaire` — bypass du gating `estOuverte`/`deleted_at` uniquement
  pour un admin, avec un bandeau discret ("Vue admin — liste supprimée" / "non ouverte au public")
  au-dessus du contenu. Toujours en lecture seule, comme un invité normal.
- **Testé** : `tsc`/`lint`/`build` propres. Rendu vérifié par capture d'écran (page de
  prévisualisation temporaire avec des données bouchon, supprimée ensuite) sur desktop et mobile —
  a révélé un vrai bug de mise en page (la rangée de boutons d'action débordait du cadre de la
  carte sur mobile, `flex-none` empêchant le conteneur de rétrécir malgré son propre `flex-wrap`)
  sur `OrganisateurCard` **et** `ListeAdminCard` ; corrigé (`w-full sm:w-auto` à la place de
  `flex-none`) et revérifié par capture d'écran. Popover Maintenance et panneau de confirmation de
  suppression (avertissement + champ de retype) vérifiés visuellement aussi. **Pas testé en
  conditions réelles** : pas de session admin active dans cet environnement pour exercer
  `/admin/*` avec de vraies données (filtre, bascule de statut, suppression réelle, aperçu admin
  d'une liste brouillon/supprimée) — la logique repose sur les mêmes patterns déjà éprouvés
  ailleurs (CRUD organisateurs, `MaintenanceToggle`), mais le flux complet reste à vérifier par
  l'utilisateur.

## Bandeau d'incitation à activer sa cagnotte Stripe sur /compte (20 août 2026)

Ajustement produit demandé par l'utilisateur, à traiter (pas un report backlog comme les sections précédentes) : un organisateur peut créer des articles en mode cotisation (`automatique` ou `cotisation_obligatoire`, voir "Règle de gestion : réservation vs cotisation par article") sans jamais être passé par la connexion de son compte Stripe (`/compte/profil`, bloc "Ma cagnotte"). Un invité qui tente de cotiser sur une liste ouverte dans ce cas tombe potentiellement dans un cas non prévu si aucun compte Stripe n'existe (`OrganizerStripeStatus` "aucun" — pas de `stripe_account_id` à fournir en `transfer_data.destination`, la création de la Checkout Session échouerait probablement). Le statut "en_attente" (compte créé, vérification en cours) reste géré correctement aujourd'hui côté invité (cotisation possible, reversement différé, voir tâche #18) — pas le même risque de rupture, mais l'organisateur a quand même intérêt à finaliser rapidement pour recevoir l'argent déjà cotisé.

Objectif : rendre ce manque visible à l'organisateur avant qu'un invité ne s'y heurte, directement sur son tableau de bord plutôt que de le découvrir a posteriori.

- **Déclencheur** : sur `/compte`, si l'organisateur a au moins un `gift_item` en mode `automatique` ou `cotisation_obligatoire` sur l'une de ses listes **ouvertes** (`events.status = 'ouverte'`, `deleted_at is null` — les brouillons ne sont pas concernés, aucun invité n'y a accès tant qu'elles ne sont pas ouvertes) **et** que son statut Stripe (`OrganizerStripeStatus`, `lib/organizer-stripe-status.ts`) n'est pas `"actif"`.
- **Contenu du bandeau**, wording différent selon le cas (ton chaleureux, sans jargon technique — cohérent avec la réécriture du bloc "Ma cagnotte" du 18 août) :
  - `"aucun"` : inviter à **créer** sa cagnotte — ex. "Certains de vos cadeaux acceptent les cotisations, mais vous n'avez pas encore connecté votre cagnotte pour recevoir l'argent."
  - `"en_attente"` : inviter à **finaliser** — ex. "Votre cagnotte est en cours de vérification : terminez sa configuration pour pouvoir recevoir l'argent de vos cotisations."
  - Bouton d'action vers `/compte/profil` dans les deux cas (pas de formulaire/onboarding inline sur le dashboard).
- **Bien visible** : en haut du dashboard, au-dessus de la liste des listes — pas un encart discret perdu au milieu d'autre chose.
- **Logique de statut à réutiliser, pas dupliquer une troisième fois** : le calcul (compte `organizer_stripe_accounts` existant ? `payouts_enabled` ?) existe déjà en deux endroits (`app/liste/[slug]/page.tsx` lignes ~52-62, et `/compte/profil`) — bonne occasion d'en extraire une fonction partagée (ex. dans `lib/organizer-stripe-status.ts`, qui ne contient aujourd'hui que le type) plutôt que de recopier la requête Supabase une troisième fois sur `/compte`.

**Statut : implémenté et testé dans la mesure du possible (20 août 2026).**

- `lib/organizer-stripe-status.ts` : nouvelle fonction pure `deriveOrganizerStripeStatus(account)`, réutilisée dans les 3 endroits (`/liste/[slug]`, `/compte/profil`, `/compte`) au lieu de la logique dupliquée. Au passage, `components/compte/StripeStatusCard.tsx` définissait son propre type `StripeStatus` avec une troisième valeur `"non_connecte"` au lieu de `"aucun"` — renommé pour n'avoir plus qu'un seul type partagé (`OrganizerStripeStatus`) dans toute l'app, la logique de rafraîchissement en direct depuis l'API Stripe propre à `/compte/profil` (pas de webhook dédié au compte Connect) reste inchangée par ailleurs.
- **Déclencheur affiné une seconde fois, sur retour d'usage (20 août 2026)** : pour le mode `auto` ("Cotisation et Réservation"), un article `status = 'disponible'` ne compte plus — tant qu'aucun invité n'a agi, il pourrait tout aussi bien être réservé directement, aucun risque avéré à ce stade. Ne compte désormais que si un invité a déjà choisi de cotiser (`status = 'cagnotte'`) ; `status = 'reserve'` reste exclu comme avant (option cotiser masquée pour les invités suivants une fois l'article verrouillé en réservation, voir "Règle de gestion : réservation vs cotisation par article"). Pour `cotisation_obligatoire` en revanche, le risque existe dès que l'article existe sur une liste ouverte, quel que soit son statut : c'est la seule action possible pour l'invité, pas d'alternative "réservation" pour absorber son intérêt en attendant. Logique vérifiée par script sur 6 cas (voir historique de session).
- Bandeau placé juste sous le titre "Bonjour {prénom}", avant le reste du tableau de bord — mêmes couleurs que la carte "Ajouter un cadeau en un lien" déjà sur cette page (`bg-[#F5E3C9]`), cohérent avec le ton chaleureux demandé.
- **Testé** : `tsc`/`lint`/`build` propres. Rendu des deux formulations (`"aucun"`/`"en_attente"`) vérifié par capture d'écran avec des données bouchon. **Pas testé en conditions réelles** : nécessiterait un compte organisateur avec un article en mode cotisation sur une liste ouverte et un statut Stripe non actif — pas de compte de test dans cet état actuellement (voir CRUD organisateurs, comptes de test précédents supprimés au fil de la session).

## Onboarding Stripe Connect embarqué, sans quitter Kdovie (20 août 2026)

Demande explicite de l'utilisateur, motivée par une crainte réelle : aujourd'hui `startStripeOnboarding`
(`app/compte/profil/stripe-actions.ts`) crée un Account Link Stripe et fait un `redirect()` complet
vers une page hébergée par Stripe (hors de kdovie.com) pour tout le parcours de vérification
d'identité — l'organisateur quitte totalement l'app, ce qui est un vrai risque de décrochage pour un
public non technique (artisans, particuliers) qui ne connaît pas Stripe. Stripe propose exactement la
réponse à ce besoin : les **Connect embedded components**, en particulier le composant "Account
onboarding", qui affiche le même formulaire de vérification (mêmes champs, même logique de
validation, mêmes statuts) mais **intégré dans une page Kdovie** — l'organisateur ne quitte jamais
`kdovie.com`, l'URL ne change pas. Vu la documentation officielle (`docs.stripe.com/connect/embedded-onboarding`,
consultée le 20 août 2026) : c'est plus de travail d'intégration qu'une simple redirection, mais
Stripe le présente comme l'option recommandée précisément pour ce cas — rien d'exotique ni de
hors des sentiers battus.

**Ce qui ne change pas** : le compte connecté reste un compte `type: "express"` avec
`business_type: "individual"`, mêmes `business_profile`/`mcc` qu'aujourd'hui — l'onboarding embarqué
est compatible avec les comptes Express (la doc Stripe distingue explicitement les scénarios "Full
Dashboard" / "Express Dashboard" / "No Dashboard", Express est un cas de figure supporté nativement).
Aucune migration de schéma nécessaire, `organizer_stripe_accounts` reste identique.

### Ce qui change

- **Nouvelles dépendances client** : `@stripe/connect-js` et `@stripe/react-connect-js` (packages
  différents de `@stripe/stripe-js`/`@stripe/react-stripe-js`, retirés du projet le 18 août pour la
  cotisation invité — pas de lien entre les deux, ne pas les réintroduire par erreur en pensant que
  c'est la même famille).
- **Extraire la création de compte dans un helper partagé** : le bloc de `startStripeOnboarding` qui
  crée le compte Stripe Connect s'il n'existe pas encore (lignes ~47-111 aujourd'hui — vérification du
  compte existant, création avec `business_type`/`business_profile`/`mcc`, upsert dans
  `organizer_stripe_accounts`) doit devenir une fonction partagée (ex.
  `lib/stripe-connect-account.ts`, `ensureOrganizerStripeAccount(userId, businessUrl)` qui retourne
  le `stripe_account_id`), réutilisée à la fois par l'ancien mécanisme (s'il est gardé, voir plus bas)
  et par le nouvel endpoint de session ci-dessous — éviter une troisième copie de cette logique de
  création de compte.
- **Nouvelle route serveur pour émettre une Account Session** (ex.
  `app/api/stripe/account-session/route.ts`, `POST`, réservé à l'utilisateur connecté — même
  vérification `auth.getUser()` que le reste de `/compte`) : appelle `ensureOrganizerStripeAccount`
  puis `stripe.accountSessions.create({ account: stripeAccountId, components: { account_onboarding:
  { enabled: true } } })`, renvoie `{ client_secret }`. Ces sessions sont éphémères et à usage
  limité — c'est le composant embarqué lui-même qui rappelle cet endpoint automatiquement quand il a
  besoin d'un nouveau secret (callback `fetchClientSecret`), pas à gérer manuellement côté Kdovie.
- **Nouveau composant client** (ex. `components/compte/StripeEmbeddedOnboarding.tsx`), affiché à la
  place de la redirection actuelle dans `StripeStatusCard.tsx` pour les statuts `"aucun"` et
  `"en_attente"` : `loadConnectAndInitialize` (avec `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, déjà
  présente en variable d'environnement, et `fetchClientSecret` pointant vers la nouvelle route) +
  `<ConnectComponentsProvider>` + `<ConnectAccountOnboarding>` (composants de `@stripe/react-connect-js`).
  Le bouton actuel ("Activer les cagnottes" / "Continuer la vérification") ouvre ce composant
  directement dans la carte "Ma cagnotte", plutôt que de soumettre un formulaire vers une Server
  Action qui redirige.
- **Rafraîchir le statut sans rechargement de page** : aujourd'hui, `/compte/profil` (lignes ~38-64)
  relit le statut Stripe à chaque chargement de page, ce qui fonctionnait naturellement puisque
  l'organisateur revenait sur cette page après la redirection Stripe. Avec l'embarqué, il ne quitte
  jamais la page — il faut déclencher ce rafraîchissement manuellement via le callback `onExit` du
  composant `ConnectAccountOnboarding` (déclenché à la sortie du flux, complété ou non), par exemple
  avec `router.refresh()` (Next.js) pour relancer le server component et sa logique existante de
  poll `stripe.accounts.retrieve()`/mise à jour de `payouts_enabled` — cette logique de poll elle-même
  ne change pas, seul le déclencheur change.
- **Thème visuel** : `loadConnectAndInitialize` accepte une option `appearance` pour aligner les
  couleurs du formulaire sur la charte Kdovie (corail `#E8734A`, jaune `#F5B942`, crème `#FFF8F0`) —
  à explorer à l'implémentation, paramètres exacts non vérifiés ici, se référer à la doc Stripe du
  moment plutôt qu'à ce texte.

### Hors périmètre pour cette tâche

- **Statut `"actif"`** : le bouton "Gérer mon compte Stripe" (lien vers le Dashboard Express externe)
  reste inchangé pour l'instant. Stripe propose aussi un composant "Account management" embarqué pour
  ce cas (gestion du compte déjà vérifié, coordonnées bancaires, etc.) — pas construit maintenant,
  scope volontairement limité à l'onboarding initial (aucun / en attente), à reprendre plus tard si
  utile.
- **Pas de fallback vers l'ancienne redirection** : l'ancien mécanisme (Account Link + redirect) peut
  être entièrement retiré plutôt que gardé en secours — la doc Stripe indique au contraire que
  l'onboarding hébergé classique ne fonctionne pas dans certains contextes (webview mobile/desktop)
  où l'embarqué, lui, fonctionne, donc pas de régression de compatibilité à craindre en le retirant.

**Statut : implémenté et testé dans la mesure du possible (20 août 2026).**

- `lib/stripe-connect-account.ts` : `ensureOrganizerStripeAccount(userId, userEmail, businessUrl)`,
  logique de création de compte extraite de `startStripeOnboarding` (même `business_type:
  "individual"`, `mcc: "7299"`, `business_profile` qu'avant — rien de changé sur ce plan). Réutilisée
  à la fois par `startStripeOnboarding` (conservé, mais uniquement pour le statut `"actif"` → bouton
  "Gérer mon compte Stripe", inchangé comme prévu dans le hors périmètre ci-dessus) et par la nouvelle
  route `app/api/stripe/account-session/route.ts` (`POST`, réservée à l'utilisateur connecté) qui émet
  l'Account Session (`stripe.accountSessions.create` avec `components.account_onboarding.enabled:
  true`).
- `components/compte/StripeEmbeddedOnboarding.tsx` : `loadConnectAndInitialize` (`@stripe/connect-js`)
  + `ConnectComponentsProvider`/`ConnectAccountOnboarding` (`@stripe/react-connect-js`), thème
  `appearance.variables` aligné sur la charte (`colorPrimary`/`buttonPrimaryColorBackground` corail,
  `colorText` `#4A3529`) — noms de variables vérifiés sur la doc Stripe du jour
  (`docs.stripe.com/connect/embedded-appearance-options`), pas devinés. `fetchClientSecret` appelle la
  nouvelle route à chaque fois qu'un secret est nécessaire, comme documenté.
- `components/compte/StripeStatusCard.tsx` : pour `"aucun"`/`"en_attente"`, le bouton n'est plus dans
  un `<form action={startStripeOnboarding}>` — un simple `onClick` bascule un état local qui affiche
  `StripeEmbeddedOnboarding` directement dans la carte, à la place du bouton. `onExit` referme le
  panneau et appelle `router.refresh()` pour relancer la logique de poll `payouts_enabled` déjà en
  place dans `app/compte/profil/page.tsx` (page.tsx lui-même inchangé, seul le déclencheur change,
  comme prévu). Le statut `"actif"` garde son ancien `<form>`/Server Action, strictement inchangé.
- Dépendances ajoutées : `@stripe/connect-js`, `@stripe/react-connect-js` — bien distinctes de
  `@stripe/stripe-js`/`@stripe/react-stripe-js` (retirées le 18 août pour la cotisation invité, pas de
  lien entre les deux familles).
- **Testé** : `tsc`/`lint`/`build` propres. Vérifié réellement (pas mocké) via une page de
  prévisualisation temporaire (supprimée ensuite) : les 3 états de `StripeStatusCard` rendus
  correctement par capture d'écran ; clic sur "Activer les cagnottes" confirmé — le bouton disparaît
  au profit du panneau embarqué, qui appelle pour de vrai `/api/stripe/account-session` (confirmé
  401 sans session, comme attendu) puis affiche sa propre UI d'erreur Stripe native ("Something went
  wrong — There was an error during authentication") plutôt que de planter, exactement le
  comportement documenté pour un composant sans session valide. Chaîne complète exercée de bout en
  bout (bouton → route → `ensureOrganizerStripeAccount` non atteint car 401 avant → composant Stripe)
  à l'exception du dernier maillon (un vrai organisateur connecté qui termine réellement la
  vérification), qui nécessiterait une session authentifiée réelle non disponible dans cet
  environnement.

## Prix Amazon réactivé (20 août 2026)

Décision du 17 août ("pas de repli prix pour Amazon") inversée sur demande de l'utilisateur, après
recherche sur les sélecteurs de scraping Amazon actuellement utilisés en pratique (20 août 2026) :
le prix faux observé à l'époque ne
venait pas d'une impossibilité générale de cibler le bon prix sur Amazon, mais d'un sélecteur non
scopé (`.a-price .a-offscreen` seul) qui matche aussi bien le prix du produit principal que ceux des
produits sponsorisés/"fréquemment achetés ensemble" ailleurs sur la même page — d'où des prix
occasionnellement erronés. En scopant la recherche au conteneur du prix principal ("buybox"), le
problème se résout sans rien perdre en fiabilité.

**Implémenté dans `lib/scrape-article.ts`**, dans le même bloc "Repli Amazon" que titre/image,
liste de sélecteurs essayés dans l'ordre (le premier qui matche un prix parsable gagne) :

1. `#corePriceDisplay_desktop_feature_div .a-price .a-offscreen`
2. `#corePrice_feature_div .a-price .a-offscreen`
3. `.priceToPay .a-offscreen`
4. `.apexPriceToPay .a-offscreen`
5. `#priceblock_ourprice`
6. `#priceblock_dealprice`

Comme pour titre/image, si aucun de ces sélecteurs ne matche (page Amazon avec une structure
différente, produit sans buybox classique...), le principe reste inchangé : champ laissé vide,
jamais de prix inventé — l'organisateur le saisit à la main dans ce cas. Amazon fait évoluer sa
structure de page régulièrement ; si des prix faux ou manquants réapparaissent sur des cas précis,
revoir/étendre cette liste de sélecteurs plutôt que de redésactiver le repli en bloc.

**Testé** : `tsc`/`lint` propres. Pas encore vérifié contre une vraie page produit Amazon en
conditions réelles (à faire au prochain ajout d'article Amazon depuis l'app).

## Intégration Bright Data pour la fiche produit Amazon (20 août 2026)

Corrige et remplace un premier brief rédigé sans avoir ce `CLAUDE.md` sous les yeux (celui-là
supposait à tort un backend PHP/MySQL sur Hostinger — sans rapport avec le vrai stack). Complète le
pipeline de scraping déjà en place (`app/compte/evenements/[slug]/scrape-action.ts` +
`lib/scrape-article.ts`, voir "Scraping des métadonnées d'article" et "Service de scraping tiers —
ScrapingAnt" plus haut) sans le réexpliquer.

**Problème résolu** : sur Amazon, ScrapingAnt tombe régulièrement sur la page de vérification
"cliquez pour continuer vos achats" et échoue même sur le titre/l'image, pas seulement le prix
(pourtant réactivé le jour même, voir "Prix Amazon réactivé" ci-dessus, avec des sélecteurs scopés
qui fonctionnent quand la page arrive jusqu'à cheerio — le souci ici est en amont, ScrapingAnt ne
récupère parfois aucune page utilisable). Amazon étant le site le plus utilisé sur Kdovie, ce trou
pèse lourd sur l'ajout d'article.

**Décision** : Bright Data (Amazon Scraper API, dataset structuré dédié) route toutes les URLs
`amazon.fr` à la place de ScrapingAnt + cheerio, **avec ScrapingAnt + le repli Amazon existant
gardés comme filet de secours** si Bright Data échoue ou n'est pas configuré — décision du
20 août 2026, après discussion : le brief initial proposait de retirer purement et simplement le
repli cheerio Amazon une fois Bright Data validé, mais ça aurait signifié plus aucun filet pour
Amazon en cas de panne/quota dépassé côté Bright Data (un service tiers de plus, pas de garantie
de disponibilité), alors que le pipeline ScrapingAnt vient justement d'être remis en état de marche
pour le prix le jour même. Le pipeline ScrapingAnt + cheerio reste **strictement inchangé** pour
tous les autres marchands.

**Pourquoi ce périmètre reste limité à Amazon** (question étudiée en amont, ne pas rouvrir) :
Bright Data n'a de dataset structuré dédié que pour un catalogue fermé de sites, où les gros
retailers français (Fnac, Darty, Cdiscount, Conforama, But) ne figurent pas. Pour un site sans
dataset dédié, l'équivalent générique Bright Data ("Web Unlocker") ne renvoie que du HTML brut à
parser soi-même — aucun gain par rapport à ScrapingAnt, en plus d'être payant à l'usage (~3$/1000
requêtes, pas de palier gratuit récurrent) contre le palier gratuit de 10 000 crédits/mois déjà en
place et validé en prod pour ScrapingAnt. Si un autre marchand pose un jour le même genre de
problème documenté (échecs répétés même via ScrapingAnt), réévaluer au cas par cas si Bright Data a
un dataset dédié pour lui — jamais basculer tout le pipeline par défaut.

### Ce qui ne change pas

- Scraping toujours strictement côté serveur (Server Action), jamais côté navigateur.
- Le formulaire d'ajout reste utilisable manuellement si tout échoue ou dépasse le timeout — jamais
  de blocage, jamais de valeur inventée (champ vide plutôt qu'un prix approximatif).
- Pas de cache : un article n'est scrapé qu'une fois, à l'ajout — `gift_items.title/price_cents/image_url`
  stockent ensuite la valeur définitive, modifiable à la main via "Modifier" (déjà en place). Aucune
  table de cache à créer.
- Les liens d'affiliation (`lib/affiliate-link.ts`, tâche #19) sont un sujet totalement indépendant,
  déjà résolu par simple ajout de `tag=<AMAZON_ASSOCIATE_TAG>` à l'URL — sans rapport avec cette
  tâche, ne pas y toucher, pas de PA-API (le projet n'en a pas besoin).

### Où intervenir — corrections apportées au brief initial après relecture du code réel

- **`hostnameFromUrl`** vit dans `lib/url.ts` (pas dans `lib/affiliate-link.ts` comme écrit dans le
  brief initial — ce fichier l'importe seulement). Réutiliser tel quel depuis `lib/url.ts`, ne pas en
  écrire un second.
- **`app/compte/evenements/[slug]/scrape-action.ts`, dans `scrapeArticleUrl`** : le point
  d'aiguillage n'est pas "en tête du fichier" mais **après** le bloc existant qui parse l'URL et
  nettoie ses paramètres (`parsedUrl.search = ""`, `parsedUrl.hash = ""`, déjà en place lignes
  ~130-148) — réutiliser ce même `parsedUrl` déjà nettoyé pour l'appel Bright Data plutôt que de
  reparser l'URL une seconde fois. Si `hostnameFromUrl(parsedUrl.toString()) === "amazon.fr"` :
  tenter `fetchAmazonProductViaBrightData(parsedUrl.toString())` ; en cas de résultat vide/échec
  (clé absente, timeout, erreur HTTP, produit introuvable), **retomber sur le chemin existant**
  (`fetchViaScrapingAnt` puis `fetchDirect` puis `parseArticleMetadata`) exactement comme
  aujourd'hui, au lieu de renvoyer `EMPTY_RESULT` directement. Pour tout autre domaine, comportement
  strictement inchangé.
- **Titre : ne pas passer par `truncateTitle`** (`lib/gift-item.ts`) comme suggéré dans le brief
  initial — cette fonction est un filet de sécurité pour l'affichage dans les emails (titres saisis
  à la main, non raccourcis au scraping), pas le mécanisme de raccourcissement lui-même. Le vrai
  mécanisme est `shortenTitle` (`lib/scrape-article.ts`), qui produit `{ title, originalTitle }` et
  alimente le bouton "voir plus"/titre complet dépliable déjà en place sur les cartes. `scrapeArticleUrl`
  applique déjà `shortenTitle` une seule fois, de façon uniforme, juste après avoir obtenu un
  résultat (lignes ~160-164) — la fonction Bright Data doit donc renvoyer le **titre brut, non
  raccourci** (comme le fait déjà `parseArticleMetadata` pour les autres sources), pour continuer à
  passer par ce même `shortenTitle` unique en aval plutôt que d'appliquer une troncature différente
  et perdre le "voir plus" sur les articles Amazon via Bright Data.
- **Nouveau fichier `lib/scrape-amazon-brightdata.ts`** : `fetchAmazonProductViaBrightData(url: string): Promise<ScrapedArticle | null>`
  (type `ScrapedArticle` déjà défini dans `lib/scrape-article.ts` — `{ title, originalTitle, priceCents, imageUrl }`,
  réutiliser tel quel, `originalTitle` toujours `null` en sortie de cette fonction pour la raison
  ci-dessus). Retourne `null` (pas un objet à champs vides) sur tout échec, pour que l'appelant sache
  distinguer "reponse Bright Data vide" de "Bright Data a échoué, il faut retomber sur ScrapingAnt".
- **Ne pas retirer** le repli Amazon spécifique de `lib/scrape-article.ts` (sélecteurs
  `#productTitle`, `#landingImage`/`#imgTagWrapperId`, et les sélecteurs de prix scopés ajoutés le
  20 août — voir "Prix Amazon réactivé" ci-dessus) — contrairement à ce que demandait le brief
  initial, ce repli reste le filet de secours pour Amazon quand Bright Data est indisponible, voir
  décision ci-dessus.

### Spécification technique Bright Data (Datasets API)

À valider par un premier appel réel avant de figer le mapping des champs, en particulier le nom
exact du champ image (non confirmé dans la doc publique consultée en amont) :

- Authentification : `Bearer <clé API>` (générée dans les paramètres du compte Bright Data).
- Endpoint : `POST https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l7q7dkf244hwjntr0&format=json`
- Corps : tableau JSON `[{"url": "..."}]` — un seul élément ici (l'API accepte jusqu'à 20 URLs par
  appel synchrone, non utile pour un ajout d'article à la fois).
- Délai : 10 à 30s en général, timeout Bright Data à 1 minute (au-delà, HTTP 202 avec un
  `snapshot_id` à interroger en asynchrone — ne devrait pas arriver pour une seule URL produit).
  Prévoir un timeout côté `fetch` d'environ 35-40s ; tout dépassement traité comme un échec propre
  (retombe sur ScrapingAnt, voir ci-dessus), jamais un crash.
- Réponse attendue (à confirmer au premier test réel) : tableau JSON, un objet par URL demandée,
  a priori `title`, `price`, `currency`, `image` (ou `images`), `availability`, `asin`, `brand`.

```bash
curl -X POST \
  "https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l7q7dkf244hwjntr0&format=json" \
  -H "Authorization: Bearer VOTRE_CLE_API" \
  -H "Content-Type: application/json" \
  -d '[{"url": "https://www.amazon.fr/dp/XXXXXXXXXX"}]'
```

### Points d'attention

- **Prix en centimes** : convertir le `price` (probablement un float en euros) avec
  `Math.round(price * 100)`, jamais une multiplication non arrondie (erreur de flottant). Vérifier
  que `currency` vaut bien `EUR` pour une URL `amazon.fr` — sinon laisser `priceCents` à `null`
  plutôt que stocker un prix dans la mauvaise devise.
- **Zone grise CGU Amazon** : Bright Data scrape Amazon sans licence officielle. Service tiers
  établi qui gère proprement l'anti-bot, mais hors du cadre strict des CGU Amazon — assumé
  consciemment par l'utilisateur, pas un point bloquant technique.
- **Palier gratuit** : de l'ordre de plusieurs milliers de requêtes/mois annoncé par Bright Data,
  non vérifié en conditions réelles. Pas de suivi de quota custom à construire côté app — le
  dashboard Bright Data suffit, même principe que pour ScrapingAnt aujourd'hui.
- **Compte à créer par l'utilisateur** sur Bright Data (Claude ne peut pas créer de compte à sa
  place), clé posée en variable d'environnement Vercel, ex. `BRIGHTDATA_API_KEY` — même schéma que
  `SCRAPINGANT_API_KEY`/`AMAZON_ASSOCIATE_TAG`/`RESEND_API_KEY`. Tant qu'elle n'est pas définie :
  repli automatique sur ScrapingAnt (voir ci-dessus), pas d'erreur.

### Definition of done

- Pour une URL `amazon.fr` valide, `scrapeArticleUrl` tente Bright Data en premier, avec repli
  automatique et silencieux sur ScrapingAnt + cheerio en cas d'échec (clé absente, timeout, erreur,
  produit introuvable) — jamais de formulaire totalement vide si le repli peut aboutir.
- Titre (raccourci via `shortenTitle` en aval, comme toutes les sources), prix (centimes, arrondi
  correct, devise vérifiée) et image correctement remontés et enregistrés sur `gift_items` pour au
  moins 5 à 10 URLs `amazon.fr` réelles et variées, y compris si possible l'ASIN qui posait problème
  avec ScrapingAnt pendant les tests précédents.
- Échec Bright Data → repli ScrapingAnt → si ça échoue aussi, formulaire vide utilisable
  manuellement, jamais de crash.
- `npx tsc --noEmit`, `npm run lint`, `npm run build` propres.
- Compte-rendu de ce qui a été réellement observé dans la réponse Bright Data (noms de champs
  exacts, notamment image et devise) — pas garanti à 100 % par la doc publique consultée en amont.

### Hors scope

- Autres TLD Amazon que `.fr` — pas nécessaire, les liens d'affiliation (tâche #19) sont eux-mêmes
  limités à `.fr` pour l'instant.
- Fnac/Darty via Awin — sujet séparé, déjà noté comme reporté (tâche #19).
- Tout ce qui touche `lib/affiliate-link.ts` — déjà fonctionnel, sans rapport avec cette tâche.

**Statut : implémenté et validé par des appels réels (24 août 2026).**

- `lib/scrape-amazon-brightdata.ts` : `fetchAmazonProductViaBrightData(url)`, appelle
  `POST https://api.brightdata.com/datasets/v3/scrape?dataset_id=gd_l7q7dkf244hwjntr0&format=json`
  avec `Authorization: Bearer BRIGHTDATA_API_KEY`. Retourne `null` (jamais d'exception) si la clé est
  absente, sur toute erreur HTTP, timeout (40s), réponse de forme inattendue, bascule asynchrone
  (`snapshot_id`) ou produit sans aucune donnée exploitable — dans tous ces cas l'appelant retombe
  sur ScrapingAnt + cheerio, filet de secours intégralement conservé.
- **Mapping des champs corrigé après un premier test réel qui a contredit la doc publique** :
  - **Pas de champ `price`** : la doc annonçait ce nom, la vraie réponse ne le contient jamais.
    Deux champs coexistent, `initial_price` (prix barré/plein tarif) et `final_price` (prix
    actuellement affiché, déjà remisé le cas échéant — identique à `initial_price` en l'absence de
    remise). `final_price` est le bon champ à utiliser en priorité (code : essaie `final_price`
    puis, à défaut, `initial_price`). Les deux sont **absents** (pas juste `null`) quand l'article
    est indisponible — pas de prix à afficher dans ce cas, déjà géré correctement (`parsePriceCents`
    renvoie `null` sur une valeur non finite).
  - **Pas de champ `main_image`** : la doc annonçait ce nom, absent de toute réponse réelle
    observée. Les vrais champs sont `image_url`/`image` (identiques dans les 5 cas testés) et
    `images` (tableau) — code essaie `image_url`, puis `image`, puis le premier élément de `images`.
  - `title` et `currency` (`"EUR"` confirmé sur amazon.fr) conformes à la doc, aucun changement.
- **`app/compte/evenements/[slug]/scrape-action.ts`** : `scrapeArticleUrl` tente
  `fetchAmazonProductViaBrightData` en premier uniquement si `hostnameFromUrl(...) === "amazon.fr"`
  (réutilise `parsedUrl` déjà nettoyé de ses paramètres, pas de re-parsing), juste après le nettoyage
  existant de l'URL. `shortenTitle` reste appliqué une seule fois en aval, sur le résultat quelle que
  soit la source (Bright Data ou ScrapingAnt/cheerio) — Bright Data renvoie bien le titre brut,
  `originalTitle` toujours `null` en sortie de la fonction comme demandé. Comportement strictement
  inchangé pour tout domaine autre qu'amazon.fr.
- **Testé réellement, avec la vraie clé Bright Data posée par l'utilisateur le 24 août 2026**, sur
  5 URLs `amazon.fr` réelles et variées (2 enceintes Echo Dot remisées en bundle, 1 enceinte Echo Dot
  indisponible, 1 aspirateur robot indisponible, 1 livre sans remise) :
  - `fetchAmazonProductViaBrightData` appelé directement pour chacune : titre, image et prix (en
    centimes, ex. 55,98 € → `5598`) corrects sur les 3 produits en stock ; sur les 2 produits
    indisponibles, `priceCents: null` tout en conservant titre et image — comportement attendu, pas
    un échec.
  - Chaîne complète `scrapeArticleUrl` testée sur une URL avec paramètres de tracking
    (`?ref=...&utm_source=...`) : nettoyage d'URL, détection amazon.fr, appel Bright Data,
    `shortenTitle` appliqué en aval — titre correctement raccourci au séparateur `" | "` avec
    `originalTitle` préservé, exactement le comportement attendu pour le bouton "voir plus".
  - `tsc`/`lint`/`build` propres après correction du mapping.
  - **Anecdote de diagnostic gardée pour référence** : les tout premiers appels (avant de trouver de
    vraies URLs produit) sont tombés sur une réponse `[{"timestamp", "input"}]` sans aucune donnée —
    confirmé via l'endpoint `/datasets/v3/progress/{snapshot_id}` (`records: 0, errors: 1`) qu'il
    s'agissait d'un vrai échec de scraping Bright Data sur ces URLs précises (ASIN choisis au hasard,
    probablement invalides), pas d'un problème de format de requête — résolu en testant avec des
    URLs `amazon.fr` réellement en ligne (trouvées via recherche web plutôt que devinées).
  - **Non testé** : le dépôt effectif sur `gift_items` via le vrai formulaire "Ajouter un cadeau"
    (`AjouterArticleForm`/`createGiftItem`) — nécessiterait une session organisateur connectée,
    indisponible dans cet environnement. La fonction de scraping elle-même est validée de bout en
    bout ; son branchement au formulaire n'a pas changé (toujours `scrapeArticleUrl`, même
    signature), risque de régression jugé faible.

### Retour d'usage : lenteur perçue sur Amazon (24 août 2026)

Une fois la clé posée, constat de l'utilisateur en usage réel : "ça marche mais c'est super long".
Diagnostiqué par mesure directe (pas une supposition) : un appel Bright Data prend 6 à 12 secondes
sur les produits testés, cohérent avec les "10 à 30s en général" annoncés par leur doc — Bright Data
scrape la page en profondeur (avis clients, analyse de sentiment, badges...) même si Kdovie n'utilise
que titre/prix/image. Rien côté code Kdovie n'ajoute de délai supplémentaire (`AjouterArticleForm`
n'appelle `scrapeArticleUrl` qu'une fois, pas de double appel).

Rapproché d'un précédent déjà tranché dans ce projet : le mode `browser=true` de ScrapingAnt avait
été testé puis retiré en août pour une lenteur comparable (9-25s, jugées "beaucoup trop lentes").
Question reposée à l'utilisateur plutôt que tranchée seul, vu ce précédent — trois options
proposées (garder tel quel / réduire le timeout pour basculer plus vite sur ScrapingAnt / retirer
Bright Data). **Décision : garder Bright Data tel quel** (contrairement au cas ScrapingAnt
`browser=true`, la fiabilité gagnée sur Amazon — site le plus utilisé sur Kdovie, historiquement le
plus sujet à échec — vaut mieux que la rapidité perdue), complétée d'une amélioration UX : overlay
plein écran (fond assombri, spinner centré, message d'attente rassurant) pendant la récupération,
plutôt que le seul petit spinner du bouton, pour que l'attente soit explicitement annoncée plutôt que
simplement subie.

- **`components/gift-items/AjouterArticleForm.tsx`** : overlay ajouté (`isPending` du
  `useTransition` déjà existant, scopé à `handleAnalyser`/"Récupérer le cadeau" — n'affecte pas le
  bouton "Ajouter à la liste", qui a son propre `pending` via `useFormStatus`), même langage visuel
  que les modales existantes (`ReservationModal`/`ContributionModal` : fond `bg-[#4A3529]/45`, carte
  crème `rounded-[28px]`). Texte : "Récupération des informations du cadeau… Ça peut prendre
  quelques secondes, surtout sur Amazon." — mentionne Amazon sans détailler Bright Data
  (implémentation interne, pas pertinente pour l'organisateur).
- **Testé** : `tsc`/`lint`/`build` propres. Rendu vérifié par capture d'écran (page de
  prévisualisation temporaire, supprimée ensuite) — overlay déclenché avec une URL volontairement
  lente à répondre pour capturer l'état "pending", conforme à la maquette voulue (fond atténué,
  spinner centré, message).

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
- Formulaire de cotisation invité sur `/liste/[slug]` (`ContributionModal`) : montant libre ou suggéré, détail des frais affiché en direct selon `fee_mode` de l'événement (formule exacte de la section "Cagnotte et frais" ci-dessus, dans `lib/fee-calculation.ts`, partagée client/serveur). "Je réserve" et "Je cotise" peuvent maintenant coexister sur un même article en mode `auto` (le premier geste d'un invité verrouille toujours le mode, cohérent avec la règle de gestion actée). **Paiement via Stripe Checkout** (page de paiement hébergée par Stripe, redirection complète — voir paragraphe dédié plus bas, ce point a changé depuis la première implémentation).
- `transfer_data.destination` **+ `on_behalf_of`** vers le compte Connect de l'organisateur, et `application_fee_amount` posés côté serveur (`app/liste/[slug]/contribution-actions.ts`). **Correction du 19 août 2026, voir section "Bug frais Stripe absorbés par Kdovie" plus bas : l'hypothèse initiale ci-dessous était fausse.** ~~le `on_behalf_of` est nécessaire pour que les frais de traitement Stripe soient portés par l'organisateur et non par la plateforme (sinon Stripe les prélève par défaut sur le solde de la plateforme, ce qui contredirait "les frais Stripe ne sont pas absorbés par Kdovie").~~ En réalité, pour une **destination charge** (celle utilisée ici, via `transfer_data.destination`), Stripe prélève toujours ses propres frais de traitement sur le solde de la **plateforme**, quel que soit le réglage de `on_behalf_of` — confirmé par la documentation Stripe officielle (`docs.stripe.com/connect/charges`). `on_behalf_of` ne change que le pays de règlement, le relevé bancaire affiché et le délai de versement ; il ne bascule jamais la charge des frais Stripe vers le compte connecté pour ce type de charge (seules les **direct charges** permettent ce choix).
- Webhook `app/api/webhooks/stripe/route.ts` : vérifie la signature (corps brut, `STRIPE_WEBHOOK_SECRET`), appelle `confirm_contribution` via `service_role` sur l'événement `checkout.session.completed` (voir paragraphe dédié plus bas — ce n'est plus `payment_intent.succeeded`, changé depuis la première implémentation). Échec de la RPC (ex. article verrouillé en réservation directe par un autre invité entre-temps) loggé plutôt qu'avalé silencieusement, pour un traitement manuel du cas rare où l'argent a déjà transité côté Stripe sans confirmation côté app.
- État "cagnotte en validation" : badge sur la carte d'article (page publique) et message dans le formulaire de cotisation quand le compte Stripe de l'organisateur n'est pas encore vérifié — la cotisation reste possible, seul le reversement est différé.
- Testé en clés de test Stripe à chaque étape (appels réels à l'API : création de compte Connect Express, génération d'Account Link, création de PaymentIntent avec `on_behalf_of`/`transfer_data`, signature de webhook via `Stripe.webhooks.generateTestHeaderString`) et visuellement (rendu du formulaire de cotisation dans ses trois états). Reste à tester en conditions réelles une fois les migrations `0009`/`0010` appliquées et `STRIPE_WEBHOOK_SECRET` créé côté utilisateur (endpoint Stripe Dashboard > Developers > Webhooks, ou `stripe listen` en local) — variable ajoutée vide dans `.env.local`, comme `RESEND_API_KEY`.

Onboarding Stripe Connect affiné après premiers tests en conditions réelles (18 août 2026) : l'utilisateur a testé le parcours organisateur et remonté que l'onboarding posait des questions orientées "entreprise" malgré des organisateurs tous particuliers. Deux correctifs dans `startStripeOnboarding` (`app/compte/profil/stripe-actions.ts`) :
- `business_type: "individual"` à la création du compte — évite l'écran de choix "particulier / entreprise" (sans ce champ, un compte de test créé pendant le diagnostic s'est retrouvé classé `company`, probablement par reconnaissance de la session Stripe du navigateur de l'utilisateur, déjà connectée à son compte entreprise réel).
- `business_profile` prérempli à la création (Stripe exige ce profil même pour un `individual`, sinon l'onboarding le redemande à l'écran) :
  - `mcc: "7299"` ("Services divers"). Code choisi après consultation de la liste officielle Stripe (docs.stripe.com/connect/setting-mcc) : le seul code explicitement lié au financement participatif est `8398` ("Charitable and Social Service Organizations - Fundraising"), écarté car il implique un statut d'organisme caritatif que les organisateurs Kdovie n'ont pas — risque d'être corrigé d'office par les contrôles de cohérence de Stripe ("Stripe doit vérifier que le MCC défini manuellement correspond bien au secteur d'activité du compte connecté"). `7299` est générique et honnête, un seul code suffit puisque tous les organisateurs ont la même activité (recevoir des cotisations cadeaux entre particuliers).
  - `url` : la liste publique de l'organisateur (`/liste/[slug]` de son événement le plus ancien) s'il en a déjà créé une, sinon le site Kdovie en repli — un particulier n'a pas de site pro à fournir.
  - `product_description` : "Cagnotte cadeau pour un événement personnel (naissance, mariage, anniversaire, etc.)".
- Testé à chaque correctif par appel réel à l'API Stripe (compte de test créé puis supprimé, `business_type`/`mcc`/`url` vérifiés sur la réponse). Deux comptes de test bloqués créés pendant le diagnostic (dont un classé `company` par erreur) supprimés côté Stripe et en base (`organizer_stripe_accounts`) pour repartir propre.

Paiement de la cotisation basculé sur Stripe Checkout (18 août 2026, retour d'usage de l'utilisateur après test du parcours invité) : trois changements dans le même mouvement.
- **Détail des frais simplifié** : le tableau "Détails" de `ContributionModal` garde deux lignes distinctes ("Frais bancaires (Stripe)" et "Frais de traitement Kdovie"), mais sans afficher le taux "(1 %)" entre parenthèses sur la seconde.
- **Carte bancaire uniquement** : `payment_method_types: ["card"]` explicite à la création du paiement — Klarna/Bancontact/etc. (proposés par défaut par Stripe sans ce réglage) ne sont plus offerts. PayPal à ajouter plus tard, pas construit maintenant.
- **Paiement sur une page Stripe séparée** plutôt qu'un Payment Element embarqué dans la modale Kdovie : l'invité ne saisit jamais son numéro de carte sur kdovie.com, ce qui rassure davantage. `contribution-actions.ts` crée une Stripe Checkout Session (`mode: "payment"`) au lieu d'un `PaymentIntent` brut ; le guest est redirigé (`window.location.assign`) vers `session.url`, puis revient sur `/liste/[slug]?cotisation=succes` ou `?cotisation=annulee` (au lieu du paramètre `redirect_status` propre à Payment Element). `@stripe/stripe-js` et `@stripe/react-stripe-js` retirés du projet, plus utilisés.
- **Piège découvert en testant contre les vraies données** : `session.payment_intent` est toujours `null` juste après `stripe.checkout.sessions.create()` — Stripe ne crée le PaymentIntent d'une Checkout Session qu'au moment où elle est réellement utilisée par l'invité, pas à sa création. Le code s'appuyait dessus pour corréler la ligne `contributions` au paiement, ce qui cassait systématiquement ("Impossible de préparer le paiement"). Corrigé : la ligne `contributions` est désormais insérée *avant* la création de la session, et son `id` sert de `client_reference_id` Stripe pour la retrouver côté webhook — `stripe_payment_intent_id` n'est renseigné qu'a posteriori, une fois l'événement reçu, pour la traçabilité. Le webhook écoute donc `checkout.session.completed` (et non plus `payment_intent.succeeded`) et filtre sur `payment_status === "paid"`.
- **Action manuelle requise côté Stripe Dashboard** : le endpoint webhook déjà créé par l'utilisateur écoutait `payment_intent.succeeded` — à reconfigurer pour écouter `checkout.session.completed` à la place, sans quoi Stripe n'envoie jamais l'événement attendu par le code actuel.
- Testé de bout en bout contre les vraies données de l'utilisateur : Checkout Session créée avec un compte Connect actif réel, événement `checkout.session.completed` signé (`Stripe.webhooks.generateTestHeaderString`) envoyé au webhook local avec une contribution de test insérée en base — `confirm_contribution` appelée avec succès (statut "succeeded", article verrouillé en "cagnotte", `funded_amount_cents` incrémenté), puis état restauré à l'identique pour ne pas polluer les données de test de l'utilisateur.

Ajustements listes publique et gestion développés (18 août 2026, voir sections dédiées ci-dessus pour le détail du cadrage) :
- Migration `0011_gift_items_is_priority.sql` (colonne `gift_items.is_priority`, non verrouillée par le trigger existant) et `0012_guest_name_optional.sql` (`reservations.guest_name`/`contributions.guest_name` deviennent nullable) écrites, pas encore appliquées à la base distante.
- `lib/gift-item-sort.ts` : logique de tri partagée (groupes 1 à 5 + sous-groupe prioritaires non terminés en tête), utilisée à l'identique sur `/liste/[slug]` (`ListePubliqueClient`) et `/compte/evenements/[slug]` (page de gestion) — `estAttenue`/`estTermine` exportées aussi pour le fond blanc/atténué des cartes.
- Étoile de mise en avant sur `GiftItemCard` (nouvelle action serveur `updateGiftItemPriority`, jamais bloquée par le verrouillage), invisible côté invité.
- Montant réel de cagnotte ("150,00 € sur 300,00 €") sur la page publique, cohérent avec la gestion. Floutage des contributeurs (gestion uniquement) sur le même modèle que le réservataire, gère le pluriel ("a" / "ont cotisé"). Titre cliquable vers `source_url` sur les deux pages. Lien "Aller l'acheter" après confirmation de réservation, si `source_url` renseignée.
- Prénom/nom devient facultatif (réservation et cotisation) : validation retirée côté client et serveur, `"Anonyme"` affiché partout où un nom serait montré (y compris fil d'activité du dashboard) une fois vide.
- Fils d'ariane "← Retour à ..." retirés de `/compte/profil`, `/compte/evenements/[slug]` et `/compte/evenements/nouveau`.
- Bloc Stripe Connect renommé "Ma cagnotte" sur `/compte/profil`, texte réécrit sans jargon ("KYC", "Connect Express" bannis).
- Terminologie "liste" plutôt qu'"événement" appliquée aux libellés UI visibles (nav, titres, boutons, formulaires) sur tout le produit — la table `events`, les routes `/compte/evenements/...` et le code restent inchangés. Les mentions du mot "événement" au sens de l'occasion réelle (la fête elle-même, pas l'outil Kdovie) sont volontairement conservées, ex. "cachés jusqu'à l'événement" sur le dashboard, deux réponses de la FAQ d'accueil.
- Vérifié : tri unitairement par script (ordre exact conforme au cadrage sur 8 cas de figure), rendu visuel des deux pages par capture d'écran (Playwright), et le parcours de réservation avec nom vide testé contre un vrai article de la base distante de l'utilisateur — a révélé que l'échec attendu (contrainte `not null` encore active tant que la migration `0012` n'est pas appliquée) remonte proprement une erreur, sans corrompre l'état de l'article (vérifié avant/après).

Suppression d'une liste par l'organisateur développée (18 août 2026, voir section dédiée ci-dessus) :
- Migrations `0014_events_deleted_at.sql` (colonne `events.deleted_at`) et `0015_profiles_is_admin.sql` (colonne `profiles.is_admin`, défaut `false`) écrites, pas encore appliquées à la base distante. Aucun changement nécessaire à la contrainte unique sur `slug` (posée en 0002) : c'est une contrainte de colonne classique déjà appliquée à toutes les lignes sans distinction de `deleted_at`.
- `SupprimerListeButton` (confirmation en deux temps, même mécanique que la suppression d'un article) posé en bas de `/compte/evenements/[slug]` ; action serveur `deleteEvent` (client authentifié normal, RLS `events_update_own` suffit puisque l'organisateur agit sur sa propre liste) qui pose `deleted_at` et redirige vers `/compte`.
- Filtre `deleted_at is null` ajouté aux requêtes `events` de `/compte` (dashboard) et `/compte/evenements/[slug]` (gestion, une liste supprimée devient inatteignable même par URL directe). Sur `/liste/[slug]`, même filtre : une liste supprimée retombe naturellement sur l'écran "liste introuvable" déjà existant via le `if (!event) notFound()` déjà en place, sans nouvelle branche de code.
- Dashboard super-administrateur sur `/admin` (`lib/admin-auth.ts` : `isCurrentUserAdmin`, re-vérifié à la fois dans `page.tsx` et dans l'action serveur `restoreEvent` — jamais la vérification page seule) : 404 (pas de redirection) pour un compte non-admin, afin de ne rien laisser deviner de cette route. Liste les événements avec `deleted_at` renseigné (tous organisateurs confondus) via le client `service_role`, bouton "Restaurer" (`deleted_at = null`). Aucun moyen de devenir admin depuis l'app — `profiles.is_admin` à activer manuellement en base après application de la migration `0015`.
- Vérifié : build/lint/tsc propres, rendu du bouton de suppression par capture d'écran (état replié et confirmation), accès `/admin` sans session confirmé bloqué en 404. Reste à tester le parcours complet (suppression, restauration) une fois les migrations `0014`/`0015` appliquées et `is_admin` activé pour le compte de l'utilisateur.

Liens d'affiliation développés (tâche #19, 18 août 2026, voir section dédiée ci-dessus) :
- `lib/affiliate-link.ts` : `getAffiliateLink(sourceUrl)`, fonction pure — ajoute/remplace `tag=<AMAZON_ASSOCIATE_TAG>` si le domaine (normalisé sans `www.` via `hostnameFromUrl`) est `amazon.fr`, sinon retourne l'URL inchangée. Repli sans erreur si la variable d'environnement est absente. Variable posée vide dans `.env.local`, comme les précédentes.
- **Piège découvert en implémentant** : appeler `getAffiliateLink` directement dans `ListePubliqueClient` (`"use client"`) provoquait un mismatch d'hydratation React — `AMAZON_ASSOCIATE_TAG` n'existe que côté serveur, absent du bundle navigateur, donc le rendu client recalculait un lien différent (sans tag) du rendu serveur. Corrigé : le calcul se fait exclusivement dans `app/liste/[slug]/page.tsx` (server component), qui enrichit chaque article de `affiliate_url`/`is_affiliate` avant de les transmettre à `ListePubliqueClient` — celui-ci ne fait plus que lire ces champs, jamais recalculer.
- Titre cliquable (`TitreArticle`, nouveau prop `sponsored`) et lien "Aller l'acheter" (état confirmé de la réservation) sur `/liste/[slug]` passent par ces champs ; `rel` passe à `sponsored noopener noreferrer` uniquement quand `is_affiliate` est vrai. Le titre cliquable de `/compte/evenements/[slug]` (gestion, `GiftItemCard`) continue de pointer vers `source_url` brute, aucun changement là.
- Mention de transparence ("lien affilié — Kdovie peut percevoir une commission, sans coût supplémentaire pour vous") affichée à côté du nom du marchand sur la carte, et sous le bouton "Aller l'acheter" dans la modale de confirmation — uniquement quand le lien est effectivement affilié.
- Testé : appels directs de `getAffiliateLink` sur de vraies `source_url` de la base (Amazon avec et sans `tag` déjà présent, but.fr, simplybook.it) — comportement conforme dans tous les cas. Rendu vérifié par capture d'écran avec un tag de test temporaire posé le temps du test puis retiré ; absence de mismatch d'hydratation confirmée (aucune erreur console).

Pages légales développées (18 août 2026, voir section dédiée ci-dessus) : `/mentions-legales`, `/cgu`, `/cgv`, contenu fourni par l'utilisateur (Kbis/statuts pour l'identité de l'éditeur), email de contact `contact@kdovie.com`. `PageLegale` (`components/layout/PageLegale.tsx`) mutualise l'ossature des trois pages ; `LiensLegaux` (`components/layout/LiensLegaux.tsx`) mutualise les trois `<Link>` ajoutés dans les six pieds de page existants (accueil, connexion, dashboard, profil, gestion de liste, liste publique) — pas de refonte plus large des footers, juste l'ajout de ces liens dans chacun, styles inchangés. Politique de confidentialité et médiation de la consommation laissées en placeholders explicites dans les mentions légales (hors périmètre de cette tâche, actions en attente côté utilisateur). CGV volontairement laissée en page "en cours de rédaction". Vérifié par build/lint/tsc propres et capture d'écran.

Page `/compte/evenements/nouveau` restylée (18 août 2026, retour d'usage : n'avait jamais été retouchée depuis le starter, sans pied de page) — en-tête/pied de page désormais alignés sur le reste du produit (logo, nav "Voir toutes mes listes", puce "Mon compte", pied de page avec les liens légaux). `NouvelEvenementForm` refait à l'identique du style des autres formulaires : sélecteur de type en pastilles (même pattern que `EnTeteListe`), champs `rounded-[18px]` cohérents, bouton avec `KdovieSpinner` pendant la création. Aucun changement à l'action serveur `createEvent`, mêmes champs (`type`/`name`/`event_date`/`slug`).

Correctif de robustesse sur `/compte/profil` (19 août 2026) : la page plantait (500) quand le compte Stripe référencé dans `organizer_stripe_accounts` devenait inaccessible (supprimé côté Stripe, accès révoqué...) — `stripe.accounts.retrieve()` n'était pas protégé par un `try/catch`, une exception non rattrapée faisait planter toute la page. Repéré en conditions réelles après un nettoyage de compte de test. Corrigé à deux endroits : `page.tsx` retombe sur le statut "en attente" si l'appel échoue plutôt que de planter ; `startStripeOnboarding` (`stripe-actions.ts`) vérifie désormais que le compte référencé est toujours accessible avant de générer un Account Link dessus, et repart automatiquement sur un compte neuf sinon (upsert plutôt qu'insert sur `organizer_stripe_accounts`, `organizer_id` étant unique). Auto-guérison : plus besoin d'intervenir manuellement en base si ce cas se reproduit.

Petites retouches d'usage sur `/compte` et la gestion de liste (19 août 2026) :
- **Bloc "Cagnotte en cours" retiré** des cartes de liste sur le dashboard `/compte` — retour d'usage de l'utilisateur, calcul associé (`cagnotte`/`cagnottePourcent` dans `evenementsAvecStats`) retiré aussi.
- **Fil d'activité du dashboard flouté** : les noms des invités dans "Dernières nouvelles" (`/compte`) étaient affichés en clair — même traitement révélable-au-clic que le réservataire/les contributeurs sur la page de gestion, porté par un nouveau composant client `FilActivite` (extrait du `page.tsx` server component pour porter l'état local de floutage par ligne).
- **Sélecteur de mode (`ModeSelect`) sur la page de gestion** : corrigé en deux temps sur retour d'usage — d'abord élargi à toute la largeur (mauvaise interprétation), puis remis à sa largeur naturelle mais posé **à côté du prix** sur la même ligne plutôt que sur sa propre ligne pleine largeur en dessous. Intitulés renommés pour plus de clarté : "Automatique" → "Cotisation et Réservation", "Cotisation obligatoire" → "Cotisation uniquement", "Cotisation impossible" → "Réservation uniquement" (`lib/gift-item.ts`, `GIFT_ITEM_MODES` — seuls les libellés changent, les `id` internes `auto`/`cotisation_obligatoire`/`cotisation_impossible` restent inchangés).

À venir, dans l'ordre : tester le parcours complet plus généralement (revue de cohérence sur toutes les pages, voir audit en cours), puis bêta fermée, puis lancement.

## Environnements dev/prod séparés (19 août 2026)

Décision avec l'utilisateur pour se donner un environnement de test avant la bêta, sans risquer les vraies données. Le montage a changé en cours de route (voir "Plan B" plus bas) — ce qui suit décrit l'état final réellement en place, pas la première idée envisagée.

- **Deux bases Supabase distinctes** : le projet Supabase existant reste la prod (celui déjà utilisé partout dans ce fichier), un second projet neuf `kdovie-dev` (ref `hvyinuoebkzghrbcbnqa`, à distinguer du ref de prod `ppsaiaesnvwnkzjisvdr` — cités ici comme simples repères, mots de passe/clés jamais consignés dans ce fichier versionné) reçoit les 18 migrations rejouées depuis le début via `supabase db push --db-url ...`, vérifiées avec `supabase migration list` (`local` = `remote` sur toute la ligne). Vraie isolation, pas de base partagée.
- **Branches** : `main` reste la branche de prod, comportement et réglage Vercel inchangés ("Production Branch" = `main`, comme avant ce chantier). Nouvelle branche `dev` pour le travail en cours, fusionnée dans `main` seulement une fois une fonctionnalité validée.
- **Plan B retenu pour Vercel, après avoir buté sur une limite réelle** : l'idée initiale (basculer la "branche de production" Vercel sur `dev` pour qu'elle hérite du domaine système `kdovie.vercel.app`, et épingler `kdovie.com` sur `main` via un domaine assigné à une branche précise) s'est heurtée à un mur : sur ce projet, l'assignation d'un domaine ne propose que les environnements globaux **Production** ou **Preview** — pas de branche précise — sauf à passer par les **Custom Environments**, une fonctionnalité Pro payante (50 $/mois par tranche de 5 environnements, confirmé dans le dashboard). Décision avec l'utilisateur : pas question de payer pour ça. **`main` reste donc la "Production Branch" Vercel**, comme il l'a toujours été — `kdovie.com` et `kdovie.vercel.app` continuent tous les deux de servir la prod exactement comme avant ce chantier, aucun changement de domaine. La branche `dev` reste une branche "Preview" ordinaire, accessible via son **alias stable** `https://kdovie-git-dev-thierrylachatpros-projects.vercel.app` (généré automatiquement par Vercel pour toute branche, régénéré au même endroit à chaque nouveau commit sur `dev` — pas besoin de le re-chercher).
- **Variables d'environnement** : les 3 variables Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) existent maintenant en double dans Vercel pour chacune : l'entrée d'origine reste scopée **Production and Preview** avec les vraies valeurs de prod (sert de valeur par défaut pour `main` et pour toute autre branche/PR) ; une seconde entrée, ajoutée via "Add New" (jamais en éditant l'entrée existante — piège rencontré en le faisant : ça **remplace** l'entrée au lieu de la compléter, et prive `main` de toute valeur), scopée **Preview restreint à la branche `dev`**, porte les valeurs de `kdovie-dev`. Vercel fait prévaloir automatiquement la version restreinte à la branche pour les déploiements de `dev`. `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` ont "Sensitive" désactivé (elles sont conçues pour être exposées au navigateur, Vercel bloque sinon avec un message explicite) ; `SUPABASE_SERVICE_ROLE_KEY` garde "Sensitive" activé. Stripe reste en clés de test partagées entre les deux environnements pour l'instant (tout le produit est déjà en mode test, voir "Cagnotte et frais").
- **`components/layout/BandeauEnvironnement.tsx`** : bandeau discret ajouté en haut de `app/layout.tsx`, visible uniquement quand `VERCEL_GIT_COMMIT_REF` (variable système Vercel, jamais présente en local) est renseignée et différente de `main` — donc sur l'alias `dev` et sur les previews de PR, jamais sur `kdovie.com`/`kdovie.vercel.app` ni en `npm run dev` local. N'a pas eu besoin d'être retouché malgré le changement de plan : il se base sur le nom de branche réel, pas sur les libellés Production/Preview de Vercel.
- **Incident post-bascule, corrigé** : pendant la courte fenêtre où `dev` était temporairement configurée comme "Production Branch" (tentative du plan initial), un commit poussé sur `dev` à ce moment-là a été promu déploiement de production actif — remettre le réglage sur `main` ensuite n'a pas fait revenir automatiquement l'ancien déploiement en ligne. Corrigé via "Promote to Production" sur le dernier déploiement `main` dans l'onglet Deployments. Ce même commit `dev`, construit pendant cette fenêtre, avait aussi été bâti sous le type d'environnement "Production" (donc avec les vraies variables de prod, pas les overrides `kdovie-dev`) — corrigé en le reconstruisant via "Redeploy" en choisissant explicitement l'environnement **Preview**. Épisode ponctuel lié à la bascule temporaire, pas un problème structurel du montage final.

## Page d'attente en production (19 août 2026)

Décision avec l'utilisateur : masquer la version actuelle (encore une bêta) aux visiteurs de `kdovie.com`, le temps de finir le travail restant avant un vrai lancement.

- **`proxy.ts`** (racine du projet — pas `middleware.ts` : Next.js 16 a renommé le fichier, `middleware.ts` fait planter le build s'il coexiste avec `proxy.ts`, piège rencontré à l'implémentation) : si `MAINTENANCE_MODE=true`, réécrit (rewrite, pas redirect — l'URL visitée reste inchangée dans le navigateur) toute requête vers `app/bientot-disponible/page.tsx`, une page statique minimale (logo, message, contact). Exclut les routes `/api/*` (webhooks Stripe, Send Email Hook Supabase — doivent continuer à répondre normalement, ce ne sont pas des visiteurs humains) et les assets Next.js. La logique de maintenance est jouée en premier, avant `updateSession` (rafraîchissement de session Supabase déjà en place dans ce fichier, voir `lib/supabase/middleware.ts`) — les deux cohabitent dans la même fonction `proxy` plutôt que dans deux fichiers séparés, Next.js n'autorisant qu'un seul point d'entrée middleware/proxy par projet.
- **Contournement** : un lien `kdovie.com/?acces=<jeton>` (comparé à `MAINTENANCE_BYPASS_TOKEN`) pose un cookie `kdovie_acces` (30 jours, httpOnly) qui laisse passer ce navigateur — permet à l'utilisateur de continuer à vérifier la vraie prod sans désactiver la page d'attente pour tout le monde.
- **Activation limitée à la prod par construction** : `MAINTENANCE_MODE`/`MAINTENANCE_BYPASS_TOKEN` doivent être posées sur Vercel dans le scope **Production uniquement** (jamais Preview) — l'environnement de dev (alias `kdovie-git-dev-...`) n'est donc jamais concerné, sans logique conditionnelle supplémentaire dans le code, cohérent avec le montage de la section "Environnements dev/prod séparés" ci-dessus.
- **Pour désactiver la page d'attente au vrai lancement** : repasser `MAINTENANCE_MODE` à `false` (ou supprimer la variable) côté Vercel, puis redéployer `main` — aucun changement de code nécessaire.
- **Statut (19 août 2026) : `MAINTENANCE_MODE=true` et `MAINTENANCE_BYPASS_TOKEN` posées sur Vercel, scope Production uniquement.** `dev` mergée dans `main` (commit `37bb51f`, fast-forward), déployé et vérifié en conditions réelles par l'utilisateur sur les différents domaines : `kdovie.com` affiche bien la page d'attente aux visiteurs normaux, le contournement `?acces=<jeton>` fonctionne. Terminé.
- **Interrupteur remplacé par un indicateur en base le 20 août 2026** (voir "Bouton admin pour basculer le mode maintenance" plus bas) : `MAINTENANCE_MODE` n'est plus lu par le code, `MAINTENANCE_BYPASS_TOKEN` reste inchangé (c'est un secret, pas un interrupteur). La variable `MAINTENANCE_MODE` peut être retirée de Vercel quand l'utilisateur le souhaite, elle n'a plus d'effet.

## En-tête unifié pour les organisateurs connectés + page Contact (19 août 2026)

Constat de l'utilisateur : les pages "sobres" (mentions légales, CGU, CGV, Aide — toutes construites via `PageLegale`) n'affichent aujourd'hui que le logo dans leur en-tête, quel que soit l'état de connexion. À côté de ça, chaque page du compte organisateur a sa propre navigation d'en-tête, légèrement différente d'une page à l'autre (ex. "Voir toutes mes listes" + pill "Mon compte" avec le pseudo sur `/compte/evenements/[slug]` et `/compte/evenements/nouveau` ; juste une pill "Mon compte" sur `/compte` ; "Aide" + "Mes listes" sur `/compte/profil`, sans "Mon compte" puisqu'on y est déjà).

Décision : uniformiser en un seul comportement, pour un organisateur **connecté**, sur absolument toutes les pages du site (y compris les 5 pages sobres, l'accueil, `/connexion`, tout le compte, et `/liste/[slug]` si l'organisateur consulte sa propre liste connecté) :

- Logo toujours à gauche, inchangé partout.
- En haut à droite, exactement deux éléments, toujours dans cet ordre, toujours les deux présents même sur la page qu'ils désignent (pas de logique "masquer le lien vers la page courante") :
  1. **"Mes listes"** → `/compte`
  2. **"Mon compte"** → `/compte/profil`
- Étiquette du bouton "Mon compte" toujours le texte littéral "Mon compte" — simplification par rapport à la pill actuelle à deux lignes avec le pseudo affiché (`nomAffiche`), qui disparaît au profit de ce libellé unique et constant.
- Rien d'autre dans cette zone : pas de bouton "+ Nouvelle liste" dans l'en-tête (il reste où il est déjà ailleurs sur `/compte`), pas de lien "Aide" dans l'en-tête (reste uniquement en pied de page comme aujourd'hui).
- **État déconnecté : hors périmètre, ne pas toucher.** Chaque page garde son en-tête actuel pour un visiteur non connecté (nav marketing de l'accueil, logo seul sur les pages sobres, etc.).
- **Implémentation suggérée** : un composant partagé (ex. `components/layout/NavConnecte.tsx`) rendu conditionnellement dans chaque en-tête de page, `estConnecte`/session déterminée côté serveur comme le fait déjà `app/page.tsx` pour l'accueil. Les pages sobres (`mentions-legales`, `cgu`, `cgv`, `aide`, `contact`) n'ont aujourd'hui aucune vérification de session — à ajouter, même schéma que l'accueil. Le composant partagé `PageLegale` (utilisé par ces pages) devra probablement accepter cette info en prop pour afficher la bonne chose dans son en-tête.

**Nouvelle page `/contact`** : formulaire (nom, email, message) plutôt qu'un simple lien mailto — nouvelle Server Action + nouveau template email (même schéma `EmailLayout`/`emailStyles` que les 5 emails transactionnels existants), envoyé à `contact@kdovie.com`, avec le `reply-to` positionné sur l'email du visiteur pour pouvoir lui répondre directement (`sendTransactionalEmail`/`lib/send-email.ts` à étendre pour accepter ce paramètre, il ne le fait pas aujourd'hui). Un champ honeypot (input invisible que seul un bot remplirait) en protection anti-spam légère, pas de dépendance supplémentaire. Page dans le style des autres pages sobres (`PageLegale`). Tous les liens "Contact" actuellement morts (`href="#"`) dans les pieds de page du produit doivent pointer vers `/contact` — même traitement que "Aide" → `/aide` fait précédemment.

**Statut : implémenté et testé dans la mesure du possible (19 août 2026).**

- `components/layout/NavConnecte.tsx` : composant partagé, rend `null` si `estConnecte` est faux (chaque page décide de la valeur à lui passer). Posé sur les 4 pages sobres via `PageLegale` (nouvelle prop `estConnecte`, défaut `false`), l'accueil (`AccueilClient`, remplace les boutons "Mes listes"/"Créer ma liste" connectés — l'état déconnecté n'a pas bougé), `/connexion` (bascule entre "Aide" et `NavConnecte` selon la session), et tout `/compte/*` (remplace les pills à pseudo/avatar — `initiales`, `nomAffiche` et les requêtes `profiles` devenues inutiles retirés au passage sur les pages où elles ne servaient qu'à ça). Les 4 pages sobres + `/connexion` n'avaient aucune vérification de session avant cette tâche — ajoutée, même schéma que `app/page.tsx`.
- **`/liste/[slug]` : cas clarifié avec l'utilisateur** — l'en-tête connecté n'apparaît que si le visiteur connecté est l'organisateur de *cette* liste précise (`user.id === event.organizer_id`), pas pour n'importe quel visiteur connecté par ailleurs. Cette page reste pensée pour des invités sans compte ; un simple compte Kdovie ouvert dans le même navigateur ne doit pas y changer l'affichage.
- **`/contact`** : `app/contact/contact-actions.ts` (`sendContactMessage`, honeypot silencieusement ignoré plutôt que signalé), `components/contact/ContactForm.tsx` (mêmes conventions que `ConnexionForm` : états idle/envoi/envoye/erreur), `components/emails/ContactEmail.tsx`. `lib/send-email.ts` étendu sur deux points : `replyTo` optionnel, et le retour passe de `void` à `boolean` — les 5 emails existants ignorent déjà la valeur de retour (aucune régression), mais `/contact` en a besoin puisque l'email est l'action elle-même : si l'envoi échoue, il n'y a rien d'autre à "protéger" comme pour une réservation ou une cotisation, l'utilisateur doit pouvoir le savoir plutôt que de croire son message parti.
- **Testé réellement** : `tsc`/`lint`/`build` propres à chaque étape. Rendu visuel vérifié par capture d'écran (page `/contact` complète, en-tête connecté isolé via une page de preview temporaire avec `estConnecte` forcé à `true`) — conforme au cahier des charges. **Pas testé** : le cas `/liste/[slug]` en conditions réelles avec un vrai compte organisateur propriétaire connecté (le compte de test `tlachat@gmail.com` avait été supprimé plus tôt dans la session via `cleanup-organizer.mjs`) — la logique (comparaison directe de deux uuid) repose sur le même composant `NavConnecte` déjà vérifié visuellement ailleurs, mais n'a pas été revue à l'écran sur cette page précise.

## Bouton admin pour basculer le mode maintenance (20 août 2026)

Demande de l'utilisateur : un bouton dans `/admin` pour passer le site en/hors maintenance, plutôt que de devoir aller changer `MAINTENANCE_MODE` sur Vercel et attendre un redéploiement (~1-2 min, pas instantané). Deux architectures possibles posées à l'utilisateur : appeler l'API Vercel pour modifier la variable d'environnement (nouveau secret `VERCEL_TOKEN`, effet différé), ou déplacer l'interrupteur en base Supabase (effet instantané, pas de nouveau secret). **Choix de l'utilisateur : l'indicateur en base.**

- **Migration `0020_app_settings.sql`** (écrite, pas encore appliquée à la base distante — comme les migrations précédentes en attente) : nouvelle table `app_settings`, une seule ligne (`id` fixe à 1, contrainte `check (id = 1)`), colonne `maintenance_mode` (boolean, défaut `false`). RLS activée avec une seule policy, lecture publique (`using (true)`) — nécessaire puisque `proxy.ts` interroge cette table pour chaque visiteur anonyme, avant toute authentification. Aucune policy d'écriture pour `anon`/`authenticated` : seule la clé `service_role` (Server Action admin, re-vérifiant `is_admin`) peut modifier cette ligne. Réutilise le trigger `set_updated_at()` déjà défini en migration 0001.
- **`proxy.ts`** : `MAINTENANCE_MODE` (variable d'environnement) remplacé par une lecture de `app_settings.maintenance_mode` à chaque requête, via un simple `fetch` REST vers Supabase (clé anon, pas le client `@supabase/ssr` complet — inutile pour une lecture publique d'une seule colonne). Si l'appel échoue (Supabase injoignable), on retombe sur "site en ligne" plutôt que de risquer de bloquer tous les visiteurs par erreur. Le mécanisme de contournement (`?acces=<jeton>` → cookie `kdovie_acces`, `MAINTENANCE_BYPASS_TOKEN`) reste inchangé, toujours en variable d'environnement (c'est un secret, pas un interrupteur à basculer). Optimisation : les visiteurs déjà munis du cookie de contournement sautent l'appel à la base, la maintenance ne les concerne de toute façon pas.
- **Isolation dev/prod obtenue sans code supplémentaire** : `app_settings` vit dans chaque base Supabase séparément (prod `ppsaiaesnvwnkzjisvdr` / dev `hvyinuoebkzghrbcbnqa`, voir "Environnements dev/prod séparés") — basculer la maintenance depuis `/admin` sur la prod n'affecte jamais l'environnement de dev, et inversement, par construction (contrairement à l'ancien `MAINTENANCE_MODE` qui nécessitait de bien le scoper "Production uniquement" sur Vercel pour obtenir cette isolation).
- **`setMaintenanceMode(enabled)`** (`app/admin/actions.ts`) : re-vérifie `isCurrentUserAdmin()` (même pattern que `restoreEvent`), écrit via `service_role`. **`MaintenanceToggle`** (`components/admin/MaintenanceToggle.tsx`), posé en haut de `/admin` : affiche l'état courant (pastille + texte), bascule directe pour repasser en ligne, confirmation en deux temps uniquement pour activer la maintenance (action plus impactante, masque le site à tous les visiteurs) — même mécanique de confirmation que la désactivation d'un organisateur (`OrganisateurCard`).
- **Testé** : `tsc`/`lint`/`build` propres. **Pas testé en conditions réelles** : bloqué tant que la migration `0020` n'est pas appliquée à la base distante (comme les migrations précédentes en attente) — `app_settings` n'existe donc encore nulle part, le bouton `/admin` échouera avec une erreur explicite tant que ce n'est pas fait.

## Workflow git

Fais un commit à chaque fois qu'une tâche du backlog (ou une fonctionnalité significative) est terminée et validée — pas un seul gros commit en fin de session. Message clair, en français, qui référence la tâche si pertinent (ex : "feat: ajout d'article multi-boutique avec scraping (#16)"). Ne commite jamais un état qui ne build pas ou dont les tests/lint échouent.

Le remote `origin` est configuré (https://github.com/thierrylachatpro/kdovie). Depuis le 18 août 2026, `git push` se fait systématiquement après chaque commit, sans attendre de confirmation — ne plus demander avant de pousser (règle précédente, abandonnée sur demande explicite de l'utilisateur).

Depuis le 19 août 2026 (voir "Environnements dev/prod séparés" ci-dessus) : le travail en cours se fait systématiquement sur la branche `dev`, jamais directement sur `main` — toute modification ou nouvelle fonctionnalité, sans exception. La bascule de `dev` vers `main` (donc vers la vraie prod, `kdovie.com`) est une décision qui appartient exclusivement à l'utilisateur : ni Claude Code ni le chef de projet Claude ne merge ou ne pousse vers `main` de leur propre initiative, même une fois une fonctionnalité testée et jugée prête. C'est lui, et lui seul, qui décide quand et quoi promouvoir en prod.

## Mode de collaboration

L'utilisateur pilote le produit avec un chef de projet Claude dans une conversation séparée (cadrage, décisions business/design, arbitrages). Ce fichier est le résumé de ce qui a été décidé là-bas. Si une décision fonctionnelle ou business manque ici pour avancer, pose la question à l'utilisateur plutôt que de trancher seul — il pourra la reporter dans l'autre conversation pour que ce fichier soit mis à jour en conséquence.
