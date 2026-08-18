-- Cagnotte et frais (tâche #18, voir CLAUDE.md > "Cagnotte et frais") :
-- l'organisateur choisit, au niveau de l'événement, qui absorbe les frais
-- Stripe + la commission Kdovie sur les contributions futures. Réglage
-- modifiable à tout moment, pas de verrouillage (contrairement au `mode`
-- des gift_items).
alter table public.events
  add column fee_mode text not null default 'frais_en_sus' check (fee_mode in ('frais_en_sus', 'frais_deduits'));
