-- Active Supabase Realtime sur gift_items : la page publique /liste/[slug]
-- s'abonne aux UPDATE (changement de status) pour la synchronisation
-- anti-doublon en direct entre invités (voir CLAUDE.md > tâche #17).
alter publication supabase_realtime add table public.gift_items;
