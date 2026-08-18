-- État d'UI "cagnotte en validation" (tâche #18, voir CLAUDE.md > "Points
-- d'attention techniques") : la page publique /liste/[slug] doit pouvoir
-- savoir si le compte Stripe de l'organisateur est vérifié, sans jamais
-- exposer stripe_account_id ni organizer_id à un invité anonyme. On ouvre
-- donc la lecture de la seule colonne payouts_enabled à anon, en plus de la
-- policy existante réservée à l'organisateur lui-même.
grant select (payouts_enabled) on public.organizer_stripe_accounts to anon;

create policy "organizer_stripe_accounts_select_public_payouts_enabled"
  on public.organizer_stripe_accounts for select
  to anon
  using (true);
