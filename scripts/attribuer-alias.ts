// Attribue un lien court kdovie.com/kdo/{alias} à chaque liste existante qui
// n'en a pas (listes supprimées exclues). Voir CLAUDE.md > "Liens courts
// mémorisables". Mêmes règles que la création d'une liste
// (lib/short-alias.ts : prénom + type, sinon nom de la liste ; en cas de
// collision, -{année} puis -2, -3…).
//
// Usage (depuis la racine du projet, lit .env.local) :
//   npx tsx scripts/attribuer-alias.ts             (simulation : affiche, ne modifie rien)
//   npx tsx scripts/attribuer-alias.ts --confirm   (applique)
//
// Attention : .env.local pointe sur la PROD. Ne lancer --confirm qu'avec le
// feu vert de l'utilisateur.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { aliasVariants, anneeAlias, suggestAlias } from "../lib/short-alias";

const confirm = process.argv.includes("--confirm");

const env: Record<string, string> = {};
for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  console.log(`Base : ${url} — ${confirm ? "APPLICATION" : "simulation (rien n'est modifié)"}\n`);

  // Tous les alias déjà pris, listes supprimées comprises.
  const { data: pris, error: errPris } = await supabase
    .from("events")
    .select("short_alias")
    .not("short_alias", "is", null);
  if (errPris) throw errPris;
  const dejaPris = new Set((pris ?? []).map((e) => e.short_alias as string));

  const { data: events, error } = await supabase
    .from("events")
    .select("id, slug, name, type, event_date, organizer_id")
    .is("short_alias", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const organisateurs = [...new Set((events ?? []).map((e) => e.organizer_id))];
  const { data: profils } = organisateurs.length
    ? await supabase.from("profiles").select("id, first_name").in("id", organisateurs)
    : { data: [] };
  const prenoms = new Map((profils ?? []).map((p) => [p.id, p.first_name as string | null]));

  let ok = 0;
  let echecs = 0;
  for (const event of events ?? []) {
    const base = suggestAlias({
      firstName: prenoms.get(event.organizer_id),
      type: event.type,
      name: event.name,
    });
    const candidats = [base, ...aliasVariants(base, anneeAlias(event.event_date), 8)];
    const alias = candidats.find((c) => !dejaPris.has(c));
    if (!alias) {
      console.log(`✗ ${event.slug} : aucun candidat libre`);
      echecs++;
      continue;
    }

    if (confirm) {
      const { error: errMaj } = await supabase
        .from("events")
        .update({ short_alias: alias })
        .eq("id", event.id)
        .is("short_alias", null);
      if (errMaj) {
        console.log(`✗ ${event.slug} → ${alias} : ${errMaj.message}`);
        echecs++;
        continue;
      }
    }
    dejaPris.add(alias);
    ok++;
    console.log(`${confirm ? "✓" : "·"} ${event.slug} → /kdo/${alias}`);
  }

  console.log(`\n${ok} alias ${confirm ? "attribués" : "à attribuer"}, ${echecs} échec(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
