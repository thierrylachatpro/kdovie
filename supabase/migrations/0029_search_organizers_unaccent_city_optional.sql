-- Recherche publique (/recherche) plus tolérante — voir CLAUDE.md >
-- "Recherche publique d'organisateurs par nom et ville".
--  * Insensible aux accents et à la casse : « heloise » trouve « Héloïse »
--    (prénom, nom, nom complet, nom de la liste et ville).
--  * Ville facultative : si p_city est vide, pas de filtre sur la ville.
--  * Garde-fou anti-annuaire : au moins 3 caractères cherchés, sinon rien.
-- Mêmes garde-fous qu'avant : searchable = true, listes ouvertes non
-- supprimées. Même signature et mêmes colonnes renvoyées.
create extension if not exists unaccent with schema extensions;

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
set search_path = public, extensions
as $$
  with params as (
    select
      '%' || lower(extensions.unaccent(btrim(coalesce(p_query, '')))) || '%' as motif,
      char_length(btrim(coalesce(p_query, ''))) as longueur,
      lower(extensions.unaccent(btrim(coalesce(p_city, '')))) as ville
  )
  select e.id, e.name, e.slug, e.type, p.first_name, p.last_name
  from params x
  join public.profiles p on p.searchable = true
  join public.events e on e.organizer_id = p.id
  where x.longueur >= 3
    and e.status = 'ouverte'
    and e.deleted_at is null
    and (x.ville = '' or lower(extensions.unaccent(coalesce(p.city, ''))) = x.ville)
    and (
      lower(extensions.unaccent(coalesce(p.first_name, ''))) like x.motif
      or lower(extensions.unaccent(coalesce(p.last_name, ''))) like x.motif
      or lower(extensions.unaccent(concat_ws(' ', p.first_name, p.last_name))) like x.motif
      or lower(extensions.unaccent(e.name)) like x.motif
    )
  order by e.created_at desc;
$$;

grant execute on function public.search_organizers(text, text) to anon;
