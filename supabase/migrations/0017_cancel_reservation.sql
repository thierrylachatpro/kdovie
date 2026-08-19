-- Annulation d'une réservation par l'invité lui-même, depuis le lien reçu
-- dans l'email de confirmation (voir CLAUDE.md > "Emails transactionnels").
-- Contrairement à une cotisation (argent déjà transféré via Stripe, non
-- annulable ici), une réservation ne déplace aucun argent — annulation en
-- libre-service.

-- La contrainte unique d'origine sur gift_item_id empêcherait une nouvelle
-- réservation tant que l'ancienne ligne (désormais annulée) existe encore
-- — remplacée par un index unique partiel qui n'exclut que les réservations
-- actives.
alter table public.reservations
  drop constraint reservations_gift_item_id_key;

create unique index reservations_gift_item_id_active_idx
  on public.reservations (gift_item_id)
  where cancelled_at is null;

create function public.cancel_reservation(
  p_reservation_id uuid
)
returns public.gift_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations;
  v_item public.gift_items;
begin
  select * into v_reservation from public.reservations where id = p_reservation_id for update;

  if not found then
    raise exception 'Réservation introuvable';
  end if;

  if v_reservation.cancelled_at is not null then
    raise exception 'Cette réservation est déjà annulée';
  end if;

  update public.reservations
  set cancelled_at = now()
  where id = p_reservation_id;

  -- Ne repasse en disponible que si l'article était bien encore au statut
  -- 'reserve' issu de cette réservation (garde-fou défensif) ; sinon on
  -- renvoie simplement l'état actuel sans y toucher.
  update public.gift_items
  set status = 'disponible', locked_at = null
  where id = v_reservation.gift_item_id and status = 'reserve'
  returning * into v_item;

  if not found then
    select * into v_item from public.gift_items where id = v_reservation.gift_item_id;
  end if;

  return v_item;
end;
$$;
