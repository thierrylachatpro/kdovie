-- Mise en avant d'un article par l'organisateur (18 août 2026, voir
-- CLAUDE.md > "Ajustements listes publique et gestion") : jamais visible ni
-- signalé côté invité, sert uniquement au tri sur /liste/[slug] et
-- /compte/evenements/[slug]. Volontairement absent du trigger
-- protect_gift_item_mode — modifiable même une fois l'article verrouillé,
-- contrairement à title/price_cents/image_url/description, puisque ça ne
-- touche à aucune règle métier côté invité.
alter table public.gift_items
  add column is_priority boolean not null default false;
