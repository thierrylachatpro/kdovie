-- Email de bienvenue organisateur (19 août 2026, voir CLAUDE.md > "Emails
-- transactionnels — email de bienvenue"). Colonne de suivi plutôt qu'une
-- heuristique temporelle sur created_at/last_sign_in_at (peu fiable selon le
-- délai entre la demande du lien magique et son premier clic) : l'email
-- n'est envoyé que si cette colonne est encore null, puis elle est posée à
-- now() dans la même requête (update ... where welcome_email_sent_at is null
-- returning *) pour rester idempotent même en cas de double appel du
-- callback d'auth.
alter table public.profiles
  add column welcome_email_sent_at timestamptz;
