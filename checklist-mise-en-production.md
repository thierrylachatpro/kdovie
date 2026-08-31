# Checklist de mise en production — Kdovie

*Préparé le 25 août 2026, à partir de l'état documenté dans CLAUDE.md. Je ne suis pas juriste ni conseiller financier — la partie juridique ci-dessous décrit les risques factuels déjà identifiés dans le projet, pas un avis juridique. Pour les points marqués ⚖️, une confirmation par un professionnel (avocat, assureur, expert-comptable) reste recommandée avant un vrai volume de transactions.*

## 1. Ce qui bloque vraiment (juridique / assurance)

Ces points ne bloquent aucune ligne de code — c'est toi qui dois trancher si tu lances quand même en connaissance de cause, ou si tu attends.

### ⚖️ Objet social de Prowebia (SASU)
Les statuts actuels ne mentionnent explicitement aucune activité de plateforme d'intermédiation / cagnotte — l'activité déclarée est développement/formation. Risque concret : un contrat ou une transaction conclu hors de l'objet social déclaré peut être contesté, et surtout, ton assureur (RC Pro) peut refuser un sinistre lié à une activité non déclarée. Remède : une modification statutaire par décision de l'associé unique (article 18 des statuts) — démarche simple et peu coûteuse pour une SASU unipersonnelle, mais à faire.

### ⚖️ RC Pro (MAIF)
Ton contrat couvre "formateur en informatique / développeur / audit", pas la gestion d'une plateforme avec cotisations entre tiers. Risque concret : si un litige survient (contribution mal reversée, litige entre invité et organisateur, faille de sécurité), l'assureur peut refuser de couvrir parce que l'activité réelle diverge de l'activité déclarée au contrat. Ça expose Prowebia (et potentiellement toi personnellement selon les cas) sur des sommes qui auraient dû être couvertes. Remède : appeler la MAIF, décrire l'activité réelle, faire étendre ou ajuster le contrat.

### ⚖️ CGV — trois décisions encore en suspens
La page CGV est volontairement restée "en cours de rédaction" tant que ces trois points ne sont pas tranchés :
- **Médiateur de la consommation** : la loi française impose à tout vendeur/plateforme B2C de proposer un médiateur de la consommation agréé et de le mentionner dans les CGV. Ce n'est pas encore souscrit.
- **Politique de remboursement des cotisations** : la règle produit actuelle ("pas de remboursement, pas de plafond") doit être formalisée noir sur blanc dans des CGV opposables aux invités qui cotisent, pas juste vécue comme une règle interne.
- **Droit de rétractation** : le délai légal de 14 jours pour se rétracter d'un achat à distance s'applique en principe aux cotisations, mais son application concrète à une cagnotte cadeau (l'argent a souvent déjà été reversé à l'organisateur) est une vraie zone grise juridique, pas juste un détail rédactionnel.

### RGPD — politique de confidentialité
Distincte des CGU, jamais rédigée. Contrairement aux trois points ci-dessus (qui sont surtout des risques *business*), celle-ci est une obligation légale inconditionnelle dès qu'un site traite des données personnelles (RGPD art. 13/14) — pas liée au volume ni au statut de la société. C'est probablement le point le plus urgent des quatre à combler avant un vrai lancement public.

**Statut (29 août 2026) : ✅ rédigée, mise en page et publiée dans le code.** Page
`/politique-de-confidentialite` construite (`app/politique-de-confidentialite/page.tsx`), lien posé
dans le pied de page de tout le site. Reste seulement à être vraiment en ligne sur kdovie.com — ce
qui suppose que `dev` soit fusionnée dans `main` (ta décision, jamais automatique).

### Google Analytics (via Google Tag Manager) et Search Console (25-29 août 2026)
**Statut : ✅ codé et testé dans la mesure du possible, ⚠️ pas encore vérifié en conditions réelles.**
Bandeau de consentement (`components/ui/BandeauCookies.tsx`) + conteneur GTM (`GTM-PT2M3BJZ`) posés
dans `app/layout.tsx`, page de confidentialité liée depuis le bandeau. Search Console déjà vérifié
par toi via un enregistrement DNS TXT chez Hostinger — rien à coder pour ça.

Ce qui reste à faire avant que ce soit vraiment actif :
1. Poser `NEXT_PUBLIC_GTM_ID=GTM-PT2M3BJZ` sur Vercel, **scope Production uniquement**.
2. Dans l'interface Google Tag Manager (tagmanager.google.com), vérifie qu'une balise "Google
   Analytics : Configuration GA4" existe, avec ton Measurement ID `G-XXXXXXXXXX` et le déclencheur
   "All Pages" — sans ça, le conteneur se charge mais rien ne remonte dans GA4.
3. Une fois en ligne, teste réellement : accepte le bandeau de cookies sur kdovie.com, vérifie dans
   GA4 (rapport "Temps réel") ou via le mode Aperçu de GTM que ta visite apparaît.

### Backlog technique : automatiser le nettoyage des comptes inactifs
La politique de confidentialité promet une rétention de 3 ans pour les comptes organisateurs
inactifs et les listes supprimées (`deleted_at`) — **rien n'existe aujourd'hui pour l'appliquer
automatiquement**, ni pour repérer un compte "inactif depuis 3 ans" (pas de colonne
`last_sign_in_at` exploitée côté app aujourd'hui, seulement côté `auth.users` via l'API admin), ni
pour purger/anonymiser à l'échéance. Reste à concevoir : quoi purger précisément (compte, ou juste
anonymiser email/prénom/nom en gardant les lignes `contributions` pour la traçabilité comptable,
cohérent avec le choix déjà fait de soft-delete pour les listes) et quel déclencheur (tâche planifiée
type cron Vercel, ou script manuel lancé périodiquement par l'utilisateur en attendant). Pas
bloquant pour un premier lancement (la politique promet la durée, pas encore l'automatisation), mais
à ne pas oublier — sinon la politique affiche un engagement non tenu.

### Point déjà couvert par la conception (à ne pas casser)
Le flux d'argent transite toujours directement via Stripe vers l'organisateur (destination charges), jamais collecté sur un compte intermédiaire Kdovie — c'est précisément ce qui permet de rester hors du champ de l'agrément ACPR. Confirmé toujours vrai dans le code actuel, à ne jamais changer sans en rediscuter.

## 2. Bascule Stripe : test → live

1. ✅ **Fait le 31 août 2026** — compte Stripe Prowebia activé (mode production confirmé, clé
   publique `pk_live_...98wm` visible sur le dashboard). Catégorie d'activité choisie : "Collecte de
   fonds ou financement participatif" (aucune catégorie "cagnotte cadeau" n'existe chez Stripe),
   description réécrite pour décrire Kdovie tel qu'il est réellement. Libellé de relevé bancaire posé
   : `KDOVIE.COM` (abrégé `KDOVIE`) — c'est ce que tes invités voient sur leur relevé bancaire.
   Type d'entreprise corrigé à l'écran (Stripe avait pré-rempli "Entrepreneur individuel" puis
   "Société en commandite" par défaut, tous deux faux pour une SASU) → "Société" / "Société non
   cotée", le bon mapping Stripe pour Prowebia. Étape optionnelle "Calcul des taxes" (Stripe Tax)
   volontairement laissée de côté pour l'instant (frais supplémentaires, sujet fiscal à voir avec ton
   expert-comptable plutôt qu'à activer par défaut).
2. ✅ **Fait le 31 août 2026** — clés live récupérées.
3. ✅ **Fait le 31 août 2026** — `STRIPE_SECRET_KEY` et `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` posées
   sur Vercel en deux entrées séparées par variable (Production = valeurs live, Preview = valeurs
   test), types corrects (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` en "Config"/non-sensible puisqu'elle
   est de toute façon exposée au navigateur, `STRIPE_SECRET_KEY` en "Secret") — vérifié directement
   sur la page Vercel.
4. ✅ **Fait le 31 août 2026** — nouveau webhook live créé (Stripe Dashboard > Workbench > Webhooks
   > "kdovie-production"), périmètre "Votre compte" (pas "Comptes connectés" — la Checkout Session
   est créée par la plateforme elle-même), événement `checkout.session.completed`, URL
   `https://kdovie.com/api/webhooks/stripe`. `STRIPE_WEBHOOK_SECRET` (le `whsec_...` live) posé sur
   Vercel, confirmé par toi.
5. ✅ **Vérifié le 31 août 2026 — ce point était une fausse piste, rien à faire.** J'ai relu la
   documentation officielle Stripe (`docs.stripe.com/connect/get-started-connect-embedded-components`)
   : il n'existe aucune liste de domaines autorisés à configurer pour les composants Connect
   embarqués (`@stripe/connect-js`). Les seules exigences réelles sont une clé publique valide, un
   Account Session côté serveur, et — uniquement si le site a une Content-Security-Policy — d'y
   autoriser `connect-js.stripe.com`/`js.stripe.com`. Kdovie n'a pas de CSP stricte définie
   aujourd'hui, donc rien à changer. Ce point du premier jet de la checklist (25 août) reposait sur
   une hypothèse non vérifiée à l'époque — je l'ai corrigé plutôt que de te faire chercher un réglage
   qui n'existe pas.
6. **Tous les comptes Stripe Connect organisateurs créés en test ne comptent pas en live.** N'importe
   quel organisateur ayant déjà fait l'onboarding pendant les tests devra recommencer une fois
   basculé en live — à prévoir dans ta communication si des organisateurs de test existent encore.
7. ⬜ **Test réel avant diffusion large** : faire une vraie cotisation avec ta propre carte (petit
   montant) pour confirmer que toute la chaîne fonctionne (Checkout → webhook →
   `confirm_contribution` → réception effective par le compte connecté) avant d'annoncer publiquement
   le lancement. Reste à faire.

## 3. Base de données

Beaucoup de migrations ont été écrites au fil des sessions ; certaines ont été confirmées appliquées en prod plus tard dans le projet (0019, 0020, 0021), mais l'historique de CLAUDE.md contient de nombreuses mentions "pas encore appliquée" à des dates plus anciennes sans confirmation ultérieure explicite pour chacune. **Avant de lancer, fais vérifier par Claude Code que toutes les migrations jusqu'à la dernière sont bien appliquées sur le projet Supabase de prod** (`supabase migration list` avec le bon `--db-url`, comparaison `local` vs `remote`) — une migration manquante en prod peut casser une fonctionnalité en silence (recherche publique, priorité, admin, désactivation de compte...).

## 4. Variables d'environnement à vérifier sur Vercel (scope Production)

Déjà posées, à confirmer toujours valides : `RESEND_API_KEY`, `SCRAPINGANT_API_KEY`, `BRIGHTDATA_API_KEY`, `SUPABASE_SEND_EMAIL_HOOK_SECRET`.

**Manquante, à poser** : `NEXT_PUBLIC_GTM_ID` = `GTM-PT2M3BJZ` (scope Production uniquement) — sans elle, le conteneur Google Tag Manager ne se charge jamais, même si le code est prêt.

À vérifier : `AMAZON_ASSOCIATE_TAG` — le statut exact n'est pas confirmé dans l'historique du projet (compte Amazon Partenaires à créer par toi si pas déjà fait). Sans elle, les liens restent simplement non affiliés (pas d'erreur), donc non bloquant pour lancer, mais à ne pas oublier si tu veux la commission.

`MAINTENANCE_MODE` (variable Vercel) : n'a plus d'effet, le mode maintenance est piloté depuis `/admin` (base de données) — tu peux la retirer de Vercel si tu veux faire le ménage, aucune action requise.

## 5. Ouvrir le site au public

Le mode maintenance est un indicateur en base (pas un redéploiement) : connecte-toi sur `/admin` avec ton compte admin, bouton "Maintenance" dans la colonne de gauche, désactive-le. Effet instantané, sans redéploiement.

## 6. Ordre recommandé (à toi de trancher le calendrier)

1. ⚠️ Objet social / RC Pro / CGV (section 1) : **toujours ouverts**, à arbitrer consciemment — rien
   de neuf signalé, ce ne sont pas des cases cochées, juste des risques que tu choisis d'assumer ou
   non.
2. ✅ **Fait, confirmé par toi le 29 août** — `NEXT_PUBLIC_GTM_ID` posée sur Vercel.
3. ✅ **Fait, confirmé par toi le 29 août** — balise GA4 vérifiée dans Google Tag Manager.
4. ✅ **Fait, confirmé par toi le 29 août** — `dev` fusionnée dans `main`.
5. ✅ **Fait, confirmé par toi le 29 août** — migrations vérifiées à jour sur la base de prod.
6. 🔄 **Presque fini (31 août)** — Stripe basculé en live : compte activé, clés live posées sur
   Vercel, webhook live créé, domaine Connect embarqué vérifié (rien à faire de ce côté). Reste
   uniquement : faire une vraie petite transaction test avant toute annonce publique.
7. ⬜ Ouvrir la page de maintenance depuis `/admin`.
8. ⬜ Communiquer / lancer.

## 7. Ce qui a changé depuis le premier jet (25 → 31 août 2026)

✅ Politique de confidentialité rédigée, mise en page et publiée dans le code.
✅ Bandeau de consentement cookies + Google Tag Manager codés et testés en local.
✅ Search Console déjà vérifié (DNS TXT).
✅ `NEXT_PUBLIC_GTM_ID` posée sur Vercel + balise GA4 vérifiée dans GTM.
✅ Migrations vérifiées à jour sur la base de prod, `dev` fusionnée dans `main`.
🔄 Stripe live : compte activé, clés + webhook posés (31 août) — reste le test réel et la
   vérification du domaine Connect embarqué.
⚠️ Toujours ouvert, sans avancée signalée : objet social, RC Pro, CGV (section 1).
