-- Verrouillage étendu d'un article une fois qu'un invité a agi dessus
-- (status différent de 'disponible') : ni modification (titre, prix, image),
-- ni suppression — cohérent avec le verrouillage déjà en place sur `mode`
-- (voir CLAUDE.md > "Gestion des articles par l'organisateur").
create or replace function public.protect_gift_item_mode()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'disponible' and (
    new.mode <> old.mode
    or new.title is distinct from old.title
    or new.price_cents is distinct from old.price_cents
    or new.image_url is distinct from old.image_url
  ) then
    raise exception 'Cet article est verrouillé, un invité a déjà agi dessus';
  end if;
  return new;
end;
$$;

create function public.protect_gift_item_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'disponible' then
    raise exception 'Cet article est verrouillé, un invité a déjà agi dessus';
  end if;
  return old;
end;
$$;

create trigger gift_items_protect_delete
  before delete on public.gift_items
  for each row execute function public.protect_gift_item_delete();
