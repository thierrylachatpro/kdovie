-- Réglages globaux de l'application, un seul enregistrement (id fixe à 1).
-- Remplace la variable d'environnement MAINTENANCE_MODE : proxy.ts lit
-- maintenance_mode à chaque requête, ce qui permet une bascule instantanée
-- depuis un bouton du dashboard admin, sans redéploiement Vercel. Voir
-- CLAUDE.md > "Bouton admin pour basculer le mode maintenance".
create table public.app_settings (
  id smallint primary key default 1,
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1);

alter table public.app_settings enable row level security;

-- Lecture publique nécessaire : proxy.ts interroge cette table pour chaque
-- visiteur anonyme, avant toute authentification. Aucune policy d'écriture
-- pour authenticated/anon : seule la clé service_role (Server Action admin,
-- re-vérifiant is_admin) peut modifier cette ligne.
create policy "app_settings_select_public"
  on public.app_settings for select
  using (true);

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();
