-- Ordre manuel des cadeaux d'une liste, défini par l'organisateur au
-- glisser-déposer (voir CLAUDE.md > "Glisser-déposer pour réordonner les
-- cadeaux"). L'ordre manuel prime sur tout : plus de tri automatique par
-- statut ni de remontée des cadeaux "mis en avant" (is_priority devient
-- inutilisée, conservée en base par prudence, plus jamais lue par l'app).
-- position s'applique aussi bien à la page de gestion qu'à la page publique
-- /liste/[slug].
alter table public.gift_items
  add column position integer not null default 0;

-- Remplissage initial : on reproduit l'ordre d'affichage actuel (cadeaux
-- mis en avant non terminés d'abord, puis par groupe de statut, puis du
-- plus récent au plus ancien à l'intérieur d'un groupe) pour ne pas
-- bousculer ce que les organisateurs voient déjà.
with ordered as (
  select
    id,
    row_number() over (
      partition by event_id
      order by
        (is_priority and status = 'disponible') desc,
        case
          when status = 'reserve' then 5
          when status = 'cagnotte'
            and price_cents is not null
            and funded_amount_cents >= price_cents then 4
          when status = 'cagnotte' then 3
          when mode = 'cotisation_obligatoire' then 2
          else 1
        end,
        created_at desc
    ) - 1 as rn
  from public.gift_items
)
update public.gift_items g
set position = ordered.rn
from ordered
where ordered.id = g.id;

create index gift_items_event_position_idx
  on public.gift_items (event_id, position);

-- position n'est volontairement pas ajoutée au trigger protect_gift_item_mode
-- (migration 0006) : l'organisateur peut réordonner un cadeau même une fois
-- qu'un invité l'a réservé ou a cotisé dessus — ça ne touche à aucune règle
-- métier côté invité, exactement comme is_priority auparavant (migration 0011).
