-- Prénom public de l'organisateur d'une liste, lisible par un invité (rôle
-- anon) — pour l'afficher sur /liste/[slug] (« La liste de {prénom} ») et
-- dans la vignette Open Graph de partage (WhatsApp/Facebook/Messenger).
-- Voir CLAUDE.md > "Fondations SEO".
--
-- Corrige un trou : depuis le passage du pseudo (display_name) au prénom
-- (first_name) le 25 août (migration 0021), plus aucun accès anon à ce
-- champ n'existait — first_name n'a jamais été accordé en colonne à anon, et
-- la fonction search_organizers ne le renvoie que pour les organisateurs
-- searchable = true. Résultat : « La liste de {prénom} » ne s'affichait
-- qu'à l'organisateur regardant sa propre liste, jamais à un invité ni au
-- robot de Facebook.
--
-- security definer plutôt qu'une policy RLS + grant de colonne, même
-- raisonnement que search_organizers (migration 0021) : la policy
-- profiles_select_public_display_name a using (true), accorder first_name en
-- colonne à anon le rendrait visible pour TOUTES les lignes de profiles. Ici
-- le prénom n'est renvoyé que dans le contexte d'une liste précise, à partir
-- de son slug — « tu as le lien de la liste → tu vois le prénom de son
-- auteur », rien de plus.
create function public.get_list_organizer_first_name(p_slug text)
returns text
language sql
security definer
set search_path = public
as $$
  select p.first_name
  from public.events e
  join public.profiles p on p.id = e.organizer_id
  where e.slug = p_slug
    and e.deleted_at is null
  limit 1;
$$;

grant execute on function public.get_list_organizer_first_name(text) to anon, authenticated;
