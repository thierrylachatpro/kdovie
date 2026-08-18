-- Prénom/nom de l'invité devient facultatif à la réservation et à la
-- cotisation (18 août 2026, voir CLAUDE.md > "Ajustements listes publique
-- et gestion"). Affiché "Anonyme" côté app quand vide.
alter table public.reservations alter column guest_name drop not null;
alter table public.contributions alter column guest_name drop not null;
