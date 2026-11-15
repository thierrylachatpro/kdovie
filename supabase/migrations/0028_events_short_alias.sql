-- Liens courts mémorisables kdovie.com/kdo/{alias} — voir CLAUDE.md >
-- "Liens courts mémorisables kdovie.com/kdo/{alias}". L'alias est une porte
-- d'entrée en plus : le slug et /liste/[slug] ne changent pas.

alter table public.events
  add column short_alias text,
  add column first_opened_at timestamptz;

alter table public.events
  add constraint events_short_alias_format check (
    short_alias is null
    or (short_alias ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(short_alias) between 3 and 40)
  );

-- Unicité sur toute la table, listes supprimées (deleted_at) comprises : un
-- alias n'est jamais réattribué (sauf suppression définitive depuis l'admin,
-- qui efface la ligne — exception acceptée, même comportement que le slug).
create unique index events_short_alias_key on public.events (short_alias);

-- Rattrapage : les listes actuellement ouvertes sont considérées comme
-- ouvertes depuis leur création (approximation suffisante). Les brouillons
-- déjà ouverts puis refermés sont indétectables et restent modifiables.
update public.events set first_opened_at = created_at where status = 'ouverte';

-- Date de première ouverture, posée en base pour couvrir tous les chemins
-- d'ouverture (organisateur et bascule admin).
create function public.set_event_first_opened_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'ouverte' and old.first_opened_at is null then
    new.first_opened_at := now();
  end if;
  return new;
end;
$$;

create trigger events_set_first_opened_at
  before update of status on public.events
  for each row execute function public.set_event_first_opened_at();

-- Garde-fou : un alias déjà attribué devient définitif dès la première
-- ouverture. Attribuer un premier alias (old.short_alias null) reste permis,
-- y compris sur une liste déjà ouverte (rattrapage des listes existantes).
create function public.protect_event_short_alias()
returns trigger
language plpgsql
as $$
begin
  if old.first_opened_at is not null
     and old.short_alias is not null
     and new.short_alias is distinct from old.short_alias then
    raise exception 'Le lien court de cette liste est définitif depuis sa première ouverture.';
  end if;
  return new;
end;
$$;

create trigger events_protect_short_alias
  before update of short_alias on public.events
  for each row execute function public.protect_event_short_alias();

-- Disponibilité d'un alias sur TOUTE la table (listes supprimées comprises,
-- invisibles via RLS pour l'organisateur). Même patron que
-- get_list_organizer_first_name (migration 0023).
create function public.is_short_alias_available(p_alias text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.events where short_alias = lower(btrim(p_alias))
  );
$$;

revoke execute on function public.is_short_alias_available(text) from public, anon;
grant execute on function public.is_short_alias_available(text) to authenticated;
