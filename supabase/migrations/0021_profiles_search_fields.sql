-- Recherche publique d'organisateurs par nom et ville — voir CLAUDE.md >
-- "Recherche publique d'organisateurs par nom et ville". Le pseudo
-- (profiles.display_name) est déprécié au profit du prénom/nom ci-dessous,
-- mais reste en base tel quel : rien à migrer rétroactivement, la colonne
-- est simplement retirée de l'app côté lecture.
alter table public.profiles
  add column first_name text,
  add column last_name text,
  add column postal_code text,
  add column city text,
  add column searchable boolean not null default false;

-- Recherche via une fonction security definer plutôt qu'une policy RLS +
-- grant de colonnes sur profiles (comme pour display_name, migration 0008).
-- Une simple policy restreinte à searchable = true ne suffirait pas ici :
-- la policy déjà en place profiles_select_public_display_name a
-- using (true), et les policies SELECT permissives se combinent par OR au
-- niveau de la ligne — une fois first_name/last_name/city accordés en
-- colonne à anon, cette policy existante les rendrait visibles pour TOUTES
-- les lignes, pas seulement celles avec searchable = true (un grant de
-- colonne n'est jamais lié à une policy précise, seulement à la ligne
-- résultante). La fonction applique le filtre elle-même, indépendamment de
-- toute policy RLS.
create function public.search_organizers(p_query text, p_city text)
returns table (
  event_id uuid,
  event_name text,
  event_slug text,
  event_type text,
  first_name text,
  last_name text
)
language sql
security definer
set search_path = public
as $$
  select e.id, e.name, e.slug, e.type, p.first_name, p.last_name
  from public.profiles p
  join public.events e on e.organizer_id = p.id
  where p.searchable = true
    and e.status = 'ouverte'
    and e.deleted_at is null
    and p.city = p_city
    and (p.first_name ilike '%' || p_query || '%' or p.last_name ilike '%' || p_query || '%')
  order by e.created_at desc;
$$;

grant execute on function public.search_organizers(text, text) to anon;
