-- Conserve le titre brut tel que scrapé (avant raccourcissement), pour le
-- contrôle "voir plus" — voir CLAUDE.md > "Raccourcissement automatique du
-- titre scrapé" (18 août 2026). Reste null pour un article en saisie
-- manuelle ou déjà assez court, rien à raccourcir dans ce cas.
alter table public.gift_items
  add column original_title text;
