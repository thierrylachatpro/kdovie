-- Recherche publique (/recherche) : le terme cherché porte désormais aussi
-- sur le nom de la liste (ex. « Noël », « mariage Julie »), en plus du prénom
-- et du nom de l'organisateur — et sur le nom complet (« Thierry Lachat »),
-- qui ne correspondait jusqu'ici ni au prénom seul ni au nom seul.
--
-- Mêmes garde-fous qu'avant (migration 0021) : seulement les organisateurs
-- searchable = true, dans la ville demandée, et seulement les listes ouvertes
-- et non supprimées. Même signature et mêmes colonnes renvoyées : aucun
-- changement côté appelant.
create or replace function public.search_organizers(p_query text, p_city text)
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
    and (
      p.first_name ilike '%' || btrim(p_query) || '%'
      or p.last_name ilike '%' || btrim(p_query) || '%'
      or concat_ws(' ', p.first_name, p.last_name) ilike '%' || btrim(p_query) || '%'
      or e.name ilike '%' || btrim(p_query) || '%'
    )
  order by e.created_at desc;
$$;

grant execute on function public.search_organizers(text, text) to anon;
