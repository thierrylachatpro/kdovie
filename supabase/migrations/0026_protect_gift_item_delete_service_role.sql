-- Ajuste protect_gift_item_delete (migration 0006) pour laisser passer les
-- suppressions initiées par le service_role. Voir CLAUDE.md > "Fiabiliser
-- l'état des migrations Supabase" (7 septembre 2026) : 0006 n'avait jamais
-- été appliquée en prod ; on la corrige avant de la pousser.
--
-- Le hard-delete d'une liste depuis /admin (`deleteEventPermanently`,
-- `app/admin/listes/actions.ts`) fait un simple `DELETE FROM events` via le
-- client service_role et s'appuie sur la cascade FK pour retirer les
-- gift_items/reservations/contributions liés. Sans cet ajustement, le
-- trigger `gift_items_protect_delete` (BEFORE DELETE, déclenché aussi sur
-- les suppressions en cascade) ferait échouer ce hard-delete dès qu'un
-- cadeau de la liste est réservé ou en cagnotte — or cette suppression
-- admin est délibérément irréversible et assumée (voir "Dashboard
-- super-administrateur", 20 août 2026).
--
-- On teste `auth.role()`, pas `current_user` : lors d'une suppression en
-- cascade, PostgreSQL exécute le trigger sous le rôle propriétaire de la
-- table (`postgres`), pas sous le rôle de session ; en revanche le GUC
-- `request.jwt.claims` posé par PostgREST persiste sur toute la
-- transaction, donc `auth.role()` renvoie bien `service_role` même dans le
-- trigger de cascade (vérifié en conditions réelles sur la base dev).
--
-- Un organisateur qui supprime un cadeau depuis la page de gestion passe,
-- lui, par le client authentifié (`auth.role() = 'authenticated'`) : il
-- reste bloqué sur un cadeau verrouillé, comportement inchangé.
create or replace function public.protect_gift_item_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'disponible' and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Cet article est verrouillé, un invité a déjà agi dessus';
  end if;
  return old;
end;
$$;
