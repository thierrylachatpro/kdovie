-- Clôture d'une cagnotte par l'organisateur (27 novembre 2026) — voir
-- CLAUDE.md > "Clôturer une cagnotte". Une fois clôturée, plus aucune
-- nouvelle cotisation n'est acceptée sur le cadeau (vérifié côté serveur dans
-- createContribution). Réversible : remettre la colonne à null rouvre la
-- cagnotte. L'argent déjà cotisé reste acquis à l'organisateur.
--
-- Pas ajoutée au trigger protect_gift_item_mode : l'organisateur doit
-- justement pouvoir clôturer un cadeau déjà verrouillé (status = 'cagnotte').
alter table public.gift_items
  add column contributions_closed_at timestamptz;
