-- Rôle super-administrateur (18 août 2026, voir CLAUDE.md > "Dashboard
-- super-administrateur") : colonne plutôt qu'une vérification d'email codée
-- en dur côté serveur. Un seul compte admin pour l'instant — à activer
-- manuellement en base (update profiles set is_admin = true where id = ...)
-- après application de cette migration, aucune UI ne le permet.
alter table public.profiles
  add column is_admin boolean not null default false;
