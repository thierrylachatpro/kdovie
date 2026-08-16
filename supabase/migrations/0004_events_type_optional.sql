-- Recadrage produit du 16 août 2026 (voir CLAUDE.md > "Recadrage") : une liste
-- n'est pas obligatoirement rattachée à un type d'événement précis. Le champ
-- `type` devient optionnel, au même titre que `event_date` (déjà nullable).
alter table public.events
  alter column type drop not null;

alter table public.events
  drop constraint events_type_check;

alter table public.events
  add constraint events_type_check
  check (type is null or type in ('naissance', 'anniversaire', 'mariage', 'noel', 'pot_depart', 'cremaillere', 'bapteme'));
