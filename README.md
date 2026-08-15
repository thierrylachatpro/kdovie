# Kdovie

La liste de cadeaux qui suit vos événements. Un compte, tous vos événements,
une cagnotte fractionnée pour chaque cadeau.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase (Postgres + Auth + Realtime) — voir `lib/supabase/`
- Stripe Connect (Express) pour la cagnotte fractionnée — voir `lib/stripe.ts`
- Resend pour les emails transactionnels — voir `lib/resend.ts`
- Déploiement prévu sur Vercel

## Démarrage local

```bash
npm install
cp .env.example .env.local   # puis renseigner les clés (voir ci-dessous)
npm run dev
```

Le site est disponible sur http://localhost:3000.

## Configuration des services externes

**Supabase** : créer un projet sur supabase.com, récupérer l'URL et les clés
dans Project settings > API, les mettre dans `.env.local`. La clé
`service_role` ne doit jamais être exposée côté client (utilisée uniquement
dans les Route Handlers Next.js). Appliquer les migrations SQL du dossier
`supabase/migrations/` (SQL editor du dashboard, ou `supabase db push` une
fois le projet lié via `supabase link`) pour créer la table `profiles`.
Dans Authentication > URL Configuration, ajouter `http://localhost:3000/auth/callback`
(et l'équivalent en production) aux Redirect URLs pour que le lien magique
fonctionne.

**Stripe** : créer un compte Stripe, activer Connect (mode Express), récupérer
les clés de test dans Developers > API keys. Le webhook (`STRIPE_WEBHOOK_SECRET`)
sera à configurer une fois les Route Handlers de paiement en place (tâche
backlog #18).

**Resend** : créer un compte sur resend.com, générer une clé API, vérifier le
domaine d'envoi une fois `kdovie.fr` réservé.

## Déploiement

Le projet est prêt pour un déploiement Vercel : connecter le repo GitHub,
renseigner les mêmes variables d'environnement que `.env.example` dans les
réglages du projet Vercel, déployer.

## Structure

```
app/            Routes (App Router)
lib/            Clients externes (Supabase, Stripe, Resend)
.github/        CI (lint + build sur chaque push/PR)
```

## Suite du chantier

Authentification organisateur en place (lien magique Supabase Auth, table
`profiles`, middleware de protection des routes `/compte`). Prochaine étape :
modèle de données (events, gift_items, reservations, contributions).
