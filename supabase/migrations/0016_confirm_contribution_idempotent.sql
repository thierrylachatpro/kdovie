-- Idempotence de confirm_contribution (19 août 2026, voir CLAUDE.md > "Bug
-- idempotence confirm_contribution") : Stripe peut livrer un même événement
-- webhook plusieurs fois (retry réseau, timeout côté récepteur) — la
-- fonction posée en 0002_events_gift_items.sql ne vérifiait pas le statut
-- de la contribution avant de réappliquer l'incrément sur gift_items,
-- causant un double comptage de funded_amount_cents si le webhook (ou un
-- appel manuel) invoquait deux fois la fonction pour la même contribution.
create or replace function public.confirm_contribution(
  p_contribution_id uuid
)
returns public.gift_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contribution public.contributions;
  v_item public.gift_items;
begin
  select * into v_contribution from public.contributions where id = p_contribution_id for update;

  if not found then
    raise exception 'Contribution introuvable';
  end if;

  -- Déjà confirmée : retourne l'état actuel sans réappliquer l'incrément
  -- ni retoucher locked_at.
  if v_contribution.status = 'succeeded' then
    select * into v_item from public.gift_items where id = v_contribution.gift_item_id;
    return v_item;
  end if;

  select * into v_item from public.gift_items where id = v_contribution.gift_item_id for update;

  if v_item.mode = 'cotisation_impossible' then
    raise exception 'Cet article n''accepte pas la cotisation';
  end if;

  if v_item.status = 'reserve' then
    raise exception 'Cet article est déjà réservé directement';
  end if;

  update public.contributions
  set status = 'succeeded'
  where id = p_contribution_id;

  update public.gift_items
  set
    status = 'cagnotte',
    funded_amount_cents = funded_amount_cents + v_contribution.amount_cents,
    locked_at = coalesce(locked_at, now())
  where id = v_item.id
  returning * into v_item;

  return v_item;
end;
$$;
