// Vérifie l'état RÉEL du schéma d'une base Supabase, migration par migration,
// via REST (service_role + anon) — sans rien modifier. Voir CLAUDE.md >
// "Fiabiliser l'état des migrations Supabase, une fois pour toutes".
//
// Ne touche PAS supabase_migrations.schema_migrations (hors de portée sans
// CLI / URL DB) : c'est un contrôle de cohérence "le schéma a-t-il bien
// l'effet de chaque migration", pas la réconciliation de la table de suivi.
//
// Usage (depuis la racine du projet) :
//   node scripts/verifier-schema.mjs                 # lit .env.local
//   node scripts/verifier-schema.mjs .env.dev        # autre fichier d'env
// L'env doit contenir NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// NEXT_PUBLIC_SUPABASE_ANON_KEY.

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(process.argv[2] || ".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !SVC || !ANON) {
  console.error("Env incomplet (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  process.exit(1);
}
console.log("Base :", URL, "\n");

const h = (key) => ({ apikey: key, Authorization: `Bearer ${key}` });
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

async function colExists(table, col) {
  const r = await fetch(`${URL}/rest/v1/${table}?select=${col}&limit=0`, { headers: h(SVC) });
  if (r.ok) return true;
  const t = await r.text();
  if (/does not exist|Could not find the '.*' column/i.test(t)) return false;
  return `? ${r.status} ${t.slice(0, 120)}`;
}
async function tableExists(table) {
  const r = await fetch(`${URL}/rest/v1/${table}?limit=0`, { headers: h(SVC) });
  if (r.ok) return true;
  if (r.status === 404) return false;
  return `? ${r.status}`;
}
async function fnExists(fn, body) {
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { ...h(SVC), "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const t = await r.text();
  if (/Could not find the function|does not exist/i.test(t)) return false;
  return true;
}
// Sonde "colonne encore NOT NULL ?" : insert voué à échouer (FK bidon).
async function notNullDropped(table, payload, col) {
  const r = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...h(SVC), "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  const t = await r.text();
  if (r.ok) return "? insert a RÉUSSI (à nettoyer !)";
  if (new RegExp(`null value in column "${col}".*not-null`, "i").test(t)) return false;
  if (/violates foreign key|is not present in table|invalid input syntax for type uuid/i.test(t)) return true;
  return `? ${t.slice(0, 160)}`;
}
async function anonCanSelect(table, col) {
  const r = await fetch(`${URL}/rest/v1/${table}?select=${col}&limit=1`, { headers: h(ANON) });
  const t = await r.text();
  if (r.ok) return true;
  if (/permission denied|does not exist|Could not find/i.test(t)) return false;
  return `? ${r.status} ${t.slice(0, 100)}`;
}

const R = {};
R["0001 profiles"] = await tableExists("profiles");
R["0002 events / gift_items / reservations / contributions / organizer_stripe_accounts"] =
  (await tableExists("events")) === true &&
  (await tableExists("gift_items")) === true &&
  (await tableExists("reservations")) === true &&
  (await tableExists("contributions")) === true &&
  (await tableExists("organizer_stripe_accounts")) === true;
R["0002 fn reserve_gift_item"] = await fnExists("reserve_gift_item", {
  p_gift_item_id: FAKE_UUID, p_guest_name: "x", p_guest_email: null,
});
R["0002 fn confirm_contribution"] = await fnExists("confirm_contribution", { p_contribution_id: FAKE_UUID });
R["0004 events.type nullable"] = await notNullDropped("events", {
  organizer_id: FAKE_UUID, name: "probe", slug: `probe-${Date.now()}`, type: null,
}, "type");
R["0005 events.status"] = await colExists("events", "status");
R["0007 gift_items.source_url nullable"] = await notNullDropped("gift_items", {
  event_id: FAKE_UUID, title: "probe", source_url: null,
}, "source_url");
R["0008 anon select profiles.display_name"] = await anonCanSelect("profiles", "display_name");
R["0009 events.fee_mode"] = await colExists("events", "fee_mode");
R["0010 anon select org_stripe.payouts_enabled"] = await anonCanSelect("organizer_stripe_accounts", "payouts_enabled");
R["0011 gift_items.is_priority"] = await colExists("gift_items", "is_priority");
R["0012 reservations.guest_name nullable"] = await notNullDropped("reservations", {
  gift_item_id: FAKE_UUID, guest_name: null,
}, "guest_name");
R["0012 contributions.guest_name nullable"] = await notNullDropped("contributions", {
  gift_item_id: FAKE_UUID, guest_name: null, amount_cents: 100,
}, "guest_name");
R["0013 gift_items.original_title"] = await colExists("gift_items", "original_title");
R["0014 events.deleted_at"] = await colExists("events", "deleted_at");
R["0015 profiles.is_admin"] = await colExists("profiles", "is_admin");
R["0017 reservations.cancelled_at"] = await colExists("reservations", "cancelled_at");
R["0017 fn cancel_reservation"] = await fnExists("cancel_reservation", { p_reservation_id: FAKE_UUID });
R["0018 profiles.welcome_email_sent_at"] = await colExists("profiles", "welcome_email_sent_at");
R["0019 profiles.disabled"] = await colExists("profiles", "disabled");
R["0020 app_settings table"] = await tableExists("app_settings");
R["0021 profiles.first_name"] = await colExists("profiles", "first_name");
R["0021 profiles.searchable"] = await colExists("profiles", "searchable");
R["0021 fn search_organizers"] = await fnExists("search_organizers", { p_query: "x", p_city: "x" });
R["0022 gift_items.position"] = await colExists("gift_items", "position");
R["0023 fn get_list_organizer_first_name"] = await fnExists("get_list_organizer_first_name", { p_slug: "x" });
R["0024 contributions.retractation_renoncee_at"] = await colExists("contributions", "retractation_renoncee_at");
R["0025 gift_item_payouts table"] = await tableExists("gift_item_payouts");
R["0025 org_stripe.last_payout_at"] = await colExists("organizer_stripe_accounts", "last_payout_at");
R["0025 org_stripe.last_payout_reminder_at"] = await colExists("organizer_stripe_accounts", "last_payout_reminder_at");

let manquants = 0;
for (const [k, v] of Object.entries(R)) {
  if (v === true) console.log("OK   ", k);
  else if (v === false) {
    console.log("MANQUE", k);
    manquants++;
  } else {
    console.log("?    ", k, "->", v);
    manquants++;
  }
}
console.log("\nNon sondables par REST (à vérifier autrement si besoin) :");
console.log("  0003 réplication temps réel (publication supabase_realtime)");
console.log("  0006 fonction/trigger protect_gift_item_delete (return type trigger)");
console.log("  0016 corps de confirm_contribution (create or replace)");
process.exit(manquants > 0 ? 1 : 0);
