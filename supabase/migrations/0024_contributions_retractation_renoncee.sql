-- Droit de rétractation : renonciation expresse à la cotisation (6 septembre
-- 2026, voir CLAUDE.md > section du même nom). L'art. L221-28 du Code de la
-- consommation permet de ne pas appliquer le droit de rétractation de 14
-- jours à une prestation pleinement exécutée avant la fin du délai, à trois
-- conditions : accord exprès et préalable à l'exécution immédiate,
-- renonciation expresse au droit de rétractation, information préalable. Une
-- cotisation Kdovie s'exécute quasi immédiatement (Stripe transfère à
-- l'organisateur dès la confirmation du paiement, transfer_data.destination).
--
-- L'invité coche une case non précochée dans ContributionModal avant le
-- paiement ; la Server Action createContribution refuse de créer la Checkout
-- Session si elle n'est pas cochée. Cette colonne horodate l'acceptation sur
-- la ligne contributions elle-même — en cas de litige, il faut pouvoir
-- prouver que la case a été cochée AVANT paiement, pas seulement que le
-- paiement a eu lieu. Nullable : les lignes antérieures n'ont pas de valeur,
-- toute nouvelle contribution en a forcément une (validation bloquante).
alter table public.contributions
  add column retractation_renoncee_at timestamptz;
