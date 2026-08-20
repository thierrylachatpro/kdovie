-- Désactivation réversible d'un organisateur par le super-administrateur —
-- voir CLAUDE.md > "Dashboard super-administrateur — CRUD organisateurs".
-- Bloque la connexion (vérifié dans app/auth/callback/route.ts juste après
-- l'échange de session) sans rien supprimer, contrairement à
-- cleanup-organizer.mjs qui reste le seul moyen de suppression réelle.
alter table public.profiles
  add column disabled boolean not null default false;
