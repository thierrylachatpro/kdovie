-- Statut de liste : brouillon / ouverte (voir CLAUDE.md > "Statut de liste").
-- Une liste est créée en brouillon, l'organisateur la travaille sans qu'un
-- invité y ait accès, puis l'ouvre explicitement — action réversible, sans
-- rapport avec le verrouillage définitif du `mode` des gift_items.
alter table public.events
  add column status text not null default 'brouillon' check (status in ('brouillon', 'ouverte'));
