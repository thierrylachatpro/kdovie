-- Pseudo public sur la page liste (voir CLAUDE.md > "Pseudo public sur la
-- page liste") : les invités (rôle anon, jamais connectés) doivent pouvoir
-- lire le pseudo de l'organisateur d'une liste — et uniquement ce champ.
-- Restriction au niveau colonne (pas seulement RLS) : on retire le SELECT
-- large accordé par défaut au rôle anon, puis on ne le redonne que pour
-- `id` (nécessaire au filtre WHERE) et `display_name`. created_at/updated_at
-- restent inaccessibles à anon. Le rôle authenticated n'est pas touché :
-- l'accès complet de l'organisateur à son propre profil (policy
-- profiles_select_own) reste inchangé.
revoke select on public.profiles from anon;
grant select (id, display_name) on public.profiles to anon;

create policy "profiles_select_public_display_name"
  on public.profiles for select
  to anon
  using (true);
