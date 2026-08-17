# Relais de scraping Kdovie

Petit serveur Node.js autonome, **indépendant de l'app Next.js**. Il reçoit une URL, va chercher la page produit à la place des fonctions Vercel (dont les IP sont souvent bloquées par les protections anti-bot des sites marchands), et renvoie le HTML brut. Aucune logique d'extraction ici : le parsing JSON-LD/Open Graph/microdonnées/Amazon reste entièrement dans `lib/scrape-article.ts` côté app Next.js — source unique. Voir `CLAUDE.md` > "Relais de scraping via Hostinger" pour le cadrage complet.

Déployé sur l'hébergement Hostinger déjà payé par l'utilisateur (offre Node.js, IP `213.130.145.175`, France).

## Pourquoi ce dossier est séparé du reste du repo

Ce n'est pas du Next.js et ce n'est pas déployé sur Vercel : c'est un projet Node.js à part entière, avec son propre `package.json` et ses propres dépendances (juste `express`), qui vit dans son propre dossier pour ne jamais être mélangé avec le build de l'app principale. Il reste dans le même dépôt git pour l'historique et la traçabilité, mais Vercel ne doit jamais essayer de le builder — voir la note "Effet de bord côté Vercel" plus bas.

## Développement local

```bash
cd scrape-relay
npm install
RELAY_SECRET=un-secret-de-test PORT=3000 npm start
```

Tester :

```bash
curl -H "x-relay-secret: un-secret-de-test" \
  "http://localhost:3000/scrape?url=https://www.amazon.fr/dp/B0863TXGM3"
```

## Déploiement sur Hostinger

Hostinger (hébergement mutualisé avec support Node.js) ne fonctionne pas par `git push` comme Vercel — il n'y a pas de déploiement continu automatique par défaut. Deux façons de mettre les fichiers en place, de la plus simple à la plus pratique :

### Option A — Panneau Hostinger (hPanel), la plus simple et toujours disponible

1. Dans hPanel, section **Avancé → Node.js**, créer une application :
   - Version Node.js : 18 ou plus récente
   - Racine de l'application : un dossier dédié (ex. `scrape-relay`)
   - Fichier de démarrage : `server.js`
   - URL de l'application : le sous-domaine/domaine `mediumblue-clam-841810.hostingersite.com` (ou un sous-chemin dédié)
2. Ajouter la variable d'environnement `RELAY_SECRET` dans la configuration de l'app Node.js (valeur secrète de ton choix, à copier aussi côté Vercel — voir plus bas).
3. Envoyer les fichiers de ce dossier (`server.js`, `package.json`) dans la racine de l'application, via le gestionnaire de fichiers de hPanel (upload direct ou zip à extraire) ou via SFTP (identifiants dans hPanel → Fichiers → Comptes FTP).
4. Lancer l'installation des dépendances depuis hPanel (bouton "NPM Install" dans l'écran Node.js) — ou en SSH si disponible sur l'offre : `npm install --production`.
5. Démarrer/redémarrer l'application depuis hPanel.
6. Vérifier : `curl https://mediumblue-clam-841810.hostingersite.com/health` doit répondre `{"ok":true}`.

À refaire (étapes 3 à 5) à chaque mise à jour de `server.js` — c'est le prix du "pas de git push" sur ce type d'hébergement.

### Option B — si l'offre Hostinger propose un déploiement Git (à vérifier)

Certaines offres Hostinger plus récentes proposent une intégration Git dans hPanel (connexion à un dépôt GitHub, déploiement en un clic ou sur push). Je ne peux pas confirmer si c'est disponible sur cette offre précise sans accès au panneau — si tu la vois dans hPanel, ce serait plus confortable que l'upload manuel à chaque changement, mais l'option A fonctionne de toute façon comme filet de sécurité universel.

### Effet de bord côté Vercel à surveiller

Vercel ne doit jamais essayer de builder ce dossier comme faisant partie de l'app Next.js. Comme il n'y a pas de `next.config.ts` ni de code Next.js dedans, il ne devrait pas être détecté automatiquement — mais si un build Vercel échoue en mentionnant `scrape-relay`, il faudra explicitement l'exclure (`.vercelignore` ou réglage "Root Directory" du projet Vercel).

## Variables d'environnement

| Variable       | Où                          | Description                                                        |
| -------------- | ---------------------------- | -------------------------------------------------------------------- |
| `RELAY_SECRET` | Hostinger (config Node.js app) | Secret partagé, doit être identique à `SCRAPE_RELAY_SECRET` sur Vercel |
| `PORT`         | Hostinger                   | Généralement fourni automatiquement par l'hébergeur, ne pas forcer sauf besoin |

Côté Vercel (Project Settings → Environment Variables) :

| Variable              | Valeur                                                        |
| --------------------- | -------------------------------------------------------------- |
| `SCRAPE_RELAY_URL`    | `https://mediumblue-clam-841810.hostingersite.com/scrape`     |
| `SCRAPE_RELAY_SECRET` | même valeur que `RELAY_SECRET` sur Hostinger                  |

Si ces deux variables ne sont pas définies sur Vercel, l'app se comporte exactement comme avant (fetch direct depuis Vercel, sans relais) — rien ne casse si le relais n'est pas encore déployé.
