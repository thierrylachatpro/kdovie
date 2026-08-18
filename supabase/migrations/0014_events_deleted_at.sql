-- Suppression d'une liste par l'organisateur (18 août 2026, voir CLAUDE.md
-- > "Suppression d'une liste par l'organisateur") : soft delete, rien n'est
-- jamais retiré en base (traçabilité comptable des contributions déjà
-- transférées via Stripe) — seule la visibilité change. Colonne
-- indépendante de `status` (brouillon/ouverte garde son sens propre).
alter table public.events
  add column deleted_at timestamptz;

-- Pas de changement nécessaire à la contrainte unique sur `slug` (posée en
-- 0002) : c'est une contrainte de colonne classique, déjà appliquée sur
-- TOUTES les lignes sans distinction de deleted_at — un slug supprimé ne
-- redevient donc jamais disponible pour une nouvelle liste.
