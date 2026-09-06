// Bascule tous les comptes Stripe Connect organisateurs déjà onboardés en
// virement MANUEL (payout_schedule.interval = "manual"). Voir CLAUDE.md >
// "Reversement manuel de la cagnotte par article".
//
// Les nouveaux comptes sont déjà créés en manuel par
// lib/stripe-connect-account.ts — ce script ne sert qu'à rattraper les
// comptes créés avant ce changement. À lancer UNE FOIS sur dev, puis UNE
// FOIS sur prod.
//
// Usage (depuis la racine du projet, lit .env.local) :
//   node scripts/basculer-payouts-manuel.mjs                 (dry-run : liste, ne modifie rien)
//   node scripts/basculer-payouts-manuel.mjs --confirm       (applique)
//
// Pour viser la PROD : poser temporairement les vraies valeurs live dans
// .env.local (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY de prod,
// STRIPE_SECRET_KEY = sk_live_…) le temps de l'exécution, ou surcharger en
// ligne :
//   NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… STRIPE_SECRET_KEY=sk_live_… \
//     node scripts/basculer-payouts-manuel.mjs --confirm

import { readFileSync } from "node:fs";

const confirm = process.argv.includes("--confirm");

const env = {};
try {
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
} catch {
  // .env.local absent : on se rabat sur process.env uniquement.
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !STRIPE_KEY) {
  console.error("Variables manquantes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / STRIPE_SECRET_KEY).");
  process.exit(1);
}

const mode = STRIPE_KEY.startsWith("sk_live") ? "LIVE" : "TEST";
console.log(`Stripe : ${mode}  |  Supabase : ${SUPABASE_URL}`);
console.log(confirm ? "Mode : APPLIQUER\n" : "Mode : dry-run (rien ne sera modifié)\n");

const rows = await fetch(
  `${SUPABASE_URL}/rest/v1/organizer_stripe_accounts?select=organizer_id,stripe_account_id`,
  { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
).then((r) => r.json());

if (!Array.isArray(rows) || rows.length === 0) {
  console.log("Aucun compte connecté en base.");
  process.exit(0);
}

let ok = 0;
let deja = 0;
let echecs = 0;

for (const row of rows) {
  const acct = row.stripe_account_id;
  const current = await fetch(`https://api.stripe.com/v1/accounts/${acct}`, {
    headers: { Authorization: `Bearer ${STRIPE_KEY}` },
  }).then((r) => r.json());

  if (current.error) {
    console.log(`  ✗ ${acct} — inaccessible (${current.error.message})`);
    echecs++;
    continue;
  }

  const interval = current.settings?.payouts?.schedule?.interval;
  if (interval === "manual") {
    console.log(`  = ${acct} — déjà en manuel`);
    deja++;
    continue;
  }

  if (!confirm) {
    console.log(`  → ${acct} — à basculer (actuellement "${interval ?? "?"}")`);
    ok++;
    continue;
  }

  const res = await fetch(`https://api.stripe.com/v1/accounts/${acct}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "settings[payouts][schedule][interval]=manual",
  }).then((r) => r.json());

  if (res.error) {
    console.log(`  ✗ ${acct} — échec (${res.error.message})`);
    echecs++;
  } else {
    console.log(`  ✓ ${acct} — basculé en manuel`);
    ok++;
  }
}

console.log(
  `\n${confirm ? "Basculés" : "À basculer"} : ${ok}  |  déjà en manuel : ${deja}  |  échecs : ${echecs}`,
);
process.exit(echecs > 0 ? 1 : 0);
