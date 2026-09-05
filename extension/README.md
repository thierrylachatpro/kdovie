# Extension Kdovie — Ajouter un cadeau

Extension Chrome (Manifest V3) qui ajoute un cadeau à une liste Kdovie
depuis n'importe quel site marchand, en lisant la page déjà ouverte dans
l'onglet actif — voir `CLAUDE.md` > "Extension navigateur Chrome" pour le
cadrage complet.

## Installer en local (mode développeur)

1. `chrome://extensions`
2. Activer **Mode développeur** (coin supérieur droit)
3. **Charger l'extension non empaquetée** → sélectionner ce dossier (`extension/`)
4. L'icône Kdovie apparaît dans la barre d'outils

Aucune étape de build : les fichiers sont chargés tels quels.

## Utilisation

1. Être connecté sur **kdovie.com** dans ce même navigateur (l'extension
   réutilise cette session, aucune connexion séparée).
2. Naviguer sur la fiche produit d'un site marchand quelconque.
3. Cliquer sur l'icône Kdovie.
4. Vérifier/corriger le titre, le prix, choisir la liste, puis
   **Ajouter à ma liste**.

Si l'extraction automatique ne trouve rien (site très protégé, page 100 %
JavaScript côté client...), le formulaire reste utilisable : titre et prix
sont à remplir à la main, exactement comme sur le formulaire "Saisie
manuelle" du site.

## Structure

- `manifest.json` — permissions `activeTab` + `scripting`,
  `host_permissions` limité à `https://kdovie.com/*`.
- `popup.html`/`popup.css`/`popup.js` — l'interface, toute la logique
  (vérification de session, déclenchement de l'extraction, soumission).
- `content/extract.js` — extraction DOM native (JSON-LD → Open Graph →
  microdonnées → repli Amazon → sélecteurs de prix visibles génériques →
  `<title>`), injectée à la demande dans l'onglet actif via
  `chrome.scripting.executeScript`. **Volontairement une implémentation
  distincte** de `lib/scrape-article.ts` (cheerio, côté serveur) — même
  logique de priorité, mais DOM natif puisqu'on lit une page déjà rendue.
  À garder alignées manuellement si l'ordre de priorité évolue d'un côté.

## Ce qui a été vérifié (et comment) avant de livrer ce dossier

Aucun vrai navigateur Chrome ni Chrome Web Store dans l'environnement où ce
code a été écrit — vérifié autrement, sans rien supposer :

- **Extraction** (`content/extract.js`) : 8 scénarios (JSON-LD simple,
  JSON-LD imbriqué sous `mainEntity` + `AggregateOffer`, Open Graph,
  microdonnées, repli Amazon, repli générique sur sélecteur de prix visible
  avec exclusion d'un prix barré, devise non-EUR détectée → prix abandonné,
  page sans aucune donnée), rejoués contre de vraies fixtures HTML servies
  via interception réseau Playwright (`page.route`) pour que
  `location.hostname` soit un vrai domaine (`amazon.fr`, etc.) — tous
  corrects.
- **Routes API** (`app/api/extension/me`, `app/api/extension/gift-items`) :
  test de bout en bout avec un **vrai compte Supabase de test** (créé via
  `admin.generateLink`, connecté pour de vrai via `/auth/confirmer` dans un
  navigateur Playwright, supprimé ensuite) — session détectée, liste de
  test bien listée, cadeau bien créé et vérifié en base (titre/prix/image),
  un second ajout se place bien en tête de liste, une tentative de cibler
  la liste d'un autre organisateur est bien refusée en 404, une session
  anonyme reçoit bien `connecte: false`.
- **Popup** (`popup.js`) : machine à états et intégration testées contre les
  vraies routes API (même compte de test que ci-dessus), `chrome.tabs` /
  `chrome.scripting` mockés avec un résultat d'extraction canné (l'extraction
  elle-même étant déjà validée séparément) — formulaire pré-rempli, ajout
  réel, état de succès avec le bon lien "Voir dans Kdovie".

**Non vérifié, à faire par un vrai test en conditions réelles** (voir
CLAUDE.md, qui anticipait déjà ce point avant toute implémentation) :

- **La session partagée `chrome-extension://` → `kdovie.com` elle-même.**
  Le test ci-dessus prouve que la logique applicative est correcte dès
  qu'une session est disponible, mais **ne prouve pas** qu'un cookie de
  session posé sur kdovie.com franchit tout seul un vrai contexte
  `chrome-extension://` (question de politique `SameSite` du cookie
  Supabase Auth, propre au navigateur réel — impossible à reproduire
  fidèlement dans ce sandbox sans un vrai Chrome). **Premier test à faire à
  l'installation locale.** Si le popup affiche "non connecté" alors qu'une
  session kdovie.com est active dans un autre onglet, c'est très
  probablement ça — à remonter plutôt qu'à re-débattre seul du correctif
  (touche la configuration des cookies d'authentification du site entier,
  sujet sensible).
- Extraction sur de vrais sites marchands (Décathlon, Fnac, Sephora,
  Maisons du Monde — les cas documentés comme problématiques côté serveur
  dans `CLAUDE.md` > "Fiabilisation du scraping multi-marchands", et la
  raison d'être de cette extension).
- Publication sur le Chrome Web Store (compte développeur à créer,
  captures d'écran, paragraphe dédié dans la politique de confidentialité).
