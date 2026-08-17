-- La saisie manuelle d'un cadeau ne demande plus de lien produit
-- (décision utilisateur du 17 août 2026) : source_url devient optionnel,
-- il reste obligatoire uniquement dans le flux "Par lien" côté formulaire.
alter table public.gift_items
  alter column source_url drop not null;
