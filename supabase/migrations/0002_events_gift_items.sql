-- Événements créés par un organisateur, rattachés à son compte permanent.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('naissance', 'anniversaire', 'mariage', 'noel', 'pot_depart', 'cremaillere', 'bapteme')),
  name text not null,
  event_date date,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_organizer_id_idx on public.events (organizer_id);

alter table public.events enable row level security;

create policy "events_select_public"
  on public.events for select
  using (true);

create policy "events_insert_own"
  on public.events for insert
  to authenticated
  with check (auth.uid() = organizer_id);

create policy "events_update_own"
  on public.events for update
  to authenticated
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

create policy "events_delete_own"
  on public.events for delete
  to authenticated
  using (auth.uid() = organizer_id);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();


-- Articles d'une liste. `mode` et `status` encodent la règle de gestion
-- réservation vs cotisation définie dans CLAUDE.md :
--   mode   : réglage organisateur — 'auto' (défaut), 'cotisation_obligatoire', 'cotisation_impossible'
--   status : état réel de l'article — 'disponible', 'reserve', 'cagnotte'
-- `funded_amount_cents` est un total public (pas de détail nominatif des
-- contributeurs ici, voir table `contributions` pour le détail réservé à
-- l'organisateur).
create table public.gift_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null,
  description text,
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text not null default 'eur',
  image_url text,
  source_url text not null,
  mode text not null default 'auto' check (mode in ('auto', 'cotisation_obligatoire', 'cotisation_impossible')),
  status text not null default 'disponible' check (status in ('disponible', 'reserve', 'cagnotte')),
  funded_amount_cents integer not null default 0 check (funded_amount_cents >= 0),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gift_items_event_id_idx on public.gift_items (event_id);

alter table public.gift_items enable row level security;

create policy "gift_items_select_public"
  on public.gift_items for select
  using (true);

create policy "gift_items_insert_own_event"
  on public.gift_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.events
      where events.id = event_id and events.organizer_id = auth.uid()
    )
  );

create policy "gift_items_update_own_event"
  on public.gift_items for update
  to authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = event_id and events.organizer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = event_id and events.organizer_id = auth.uid()
    )
  );

create policy "gift_items_delete_own_event"
  on public.gift_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.events
      where events.id = event_id and events.organizer_id = auth.uid()
    )
  );

create trigger gift_items_set_updated_at
  before update on public.gift_items
  for each row execute function public.set_updated_at();

-- Empêche l'organisateur de changer le mode une fois qu'un invité a agi
-- (status différent de 'disponible') — verrouillage définitif, voir CLAUDE.md.
create function public.protect_gift_item_mode()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'disponible' and new.mode <> old.mode then
    raise exception 'Le mode ne peut plus être modifié, un invité a déjà agi sur cet article';
  end if;
  return new;
end;
$$;

create trigger gift_items_protect_mode
  before update on public.gift_items
  for each row execute function public.protect_gift_item_mode();


-- Réservation directe d'un article par un invité (sans compte). Un seul
-- invité peut réserver un article donné (contrainte unique). Écriture
-- réservée au service_role (Route Handlers Next.js) via la fonction
-- reserve_gift_item ci-dessous — pas de policy insert pour anon/authenticated.
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  gift_item_id uuid not null unique references public.gift_items (id) on delete cascade,
  guest_name text not null,
  guest_email text,
  reserved_at timestamptz not null default now(),
  cancelled_at timestamptz
);

alter table public.reservations enable row level security;

create policy "reservations_select_organizer"
  on public.reservations for select
  to authenticated
  using (
    exists (
      select 1 from public.gift_items
      join public.events on events.id = gift_items.event_id
      where gift_items.id = gift_item_id and events.organizer_id = auth.uid()
    )
  );


-- Contribution (cotisation) d'un invité sur un article, en cagnotte.
-- Écriture réservée au service_role également (création en 'pending' à
-- l'initiation du paiement Stripe, passage à 'succeeded' par le webhook
-- via confirm_contribution ci-dessous).
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  gift_item_id uuid not null references public.gift_items (id) on delete cascade,
  guest_name text not null,
  guest_email text,
  amount_cents integer not null check (amount_cents > 0),
  stripe_payment_intent_id text unique,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  created_at timestamptz not null default now()
);

create index contributions_gift_item_id_idx on public.contributions (gift_item_id);

alter table public.contributions enable row level security;

create policy "contributions_select_organizer"
  on public.contributions for select
  to authenticated
  using (
    exists (
      select 1 from public.gift_items
      join public.events on events.id = gift_items.event_id
      where gift_items.id = gift_item_id and events.organizer_id = auth.uid()
    )
  );


-- Compte Stripe Connect Express d'un organisateur (1:1 avec profiles).
-- payouts_enabled reflète le statut KYC ("cagnotte en validation" tant que
-- false, voir CLAUDE.md > Points d'attention techniques).
create table public.organizer_stripe_accounts (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null unique references public.profiles (id) on delete cascade,
  stripe_account_id text not null unique,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizer_stripe_accounts enable row level security;

create policy "organizer_stripe_accounts_select_own"
  on public.organizer_stripe_accounts for select
  to authenticated
  using (auth.uid() = organizer_id);

create trigger organizer_stripe_accounts_set_updated_at
  before update on public.organizer_stripe_accounts
  for each row execute function public.set_updated_at();


-- Verrouille atomiquement un article en réservation directe (row lock via
-- FOR UPDATE, évite la double réservation en cas de clics simultanés).
-- Security definer : à appeler uniquement depuis un Route Handler via le
-- client service_role (lib/supabase/admin.ts), jamais depuis le navigateur.
create function public.reserve_gift_item(
  p_gift_item_id uuid,
  p_guest_name text,
  p_guest_email text
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.gift_items;
  v_reservation public.reservations;
begin
  select * into v_item from public.gift_items where id = p_gift_item_id for update;

  if not found then
    raise exception 'Article introuvable';
  end if;

  if v_item.mode = 'cotisation_obligatoire' then
    raise exception 'Cet article ne peut être que financé collectivement';
  end if;

  if v_item.status <> 'disponible' then
    raise exception 'Cet article n''est plus disponible à la réservation';
  end if;

  insert into public.reservations (gift_item_id, guest_name, guest_email)
  values (p_gift_item_id, p_guest_name, p_guest_email)
  returning * into v_reservation;

  update public.gift_items
  set status = 'reserve', locked_at = now()
  where id = p_gift_item_id;

  return v_reservation;
end;
$$;

-- Confirme une cotisation (appelée par le webhook Stripe une fois le
-- paiement effectivement encaissé, jamais directement par le client) et
-- verrouille l'article en mode cagnotte. Pas de plafond : le sur-financement
-- reste acquis à l'organisateur (voir CLAUDE.md).
create function public.confirm_contribution(
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
