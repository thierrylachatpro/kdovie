-- Reversement manuel de la cagnotte par article (6 septembre 2026, voir
-- CLAUDE.md > "Reversement manuel de la cagnotte par article, initié par
-- l'organisateur"). Les comptes connectés passent en payout_schedule
-- "manual" côté Stripe (fait à la création du compte + script ponctuel pour
-- les comptes existants) : plus aucun virement automatique, l'organisateur
-- déclenche chaque reversement lui-même, article par article, depuis la page
-- de gestion de sa liste.
--
-- Le solde Stripe est fongible au niveau du compte entier, pas réparti par
-- cagnotte — Kdovie suit donc lui-même combien a déjà été reversé pour
-- chaque article. Un historique par virement (pas un simple cumul) pour
-- garder une trace vérifiable, cohérent avec la table contributions.
-- "Montant restant à reverser pour un article" =
--   funded_amount_cents(article) − somme(gift_item_payouts.amount_cents pour cet article).
create table public.gift_item_payouts (
  id uuid primary key default gen_random_uuid(),
  gift_item_id uuid not null references public.gift_items (id) on delete cascade,
  stripe_payout_id text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  created_at timestamptz not null default now()
);

create index gift_item_payouts_gift_item_id_idx on public.gift_item_payouts (gift_item_id);

alter table public.gift_item_payouts enable row level security;

-- Lecture pour l'organisateur propriétaire de la liste (affichage "déjà
-- reversé" sur la page de gestion) — même schéma que
-- contributions_select_organizer. Aucune policy d'écriture : seul le
-- service_role (Server Action de reversement, qui re-vérifie la propriété)
-- insère.
create policy "gift_item_payouts_select_organizer"
  on public.gift_item_payouts for select
  to authenticated
  using (
    exists (
      select 1 from public.gift_items
      join public.events on events.id = gift_items.event_id
      where gift_items.id = gift_item_id and events.organizer_id = auth.uid()
    )
  );

-- Date du dernier virement effectif par compte connecté — pour le filet des
-- 90 jours (email de rappel, cron) sans avoir à interroger l'API Stripe à
-- chaque exécution. last_payout_reminder_at : date du dernier email de
-- rappel envoyé, pour ne pas relancer l'organisateur tous les jours.
alter table public.organizer_stripe_accounts
  add column last_payout_at timestamptz,
  add column last_payout_reminder_at timestamptz;
