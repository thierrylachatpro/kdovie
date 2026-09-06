import { emettreAccountSession } from "@/lib/stripe-account-session";

// Session pour le composant d'onboarding embarqué
// (ConnectAccountOnboarding, components/compte/StripeEmbeddedOnboarding.tsx).
// Ces sessions sont éphémères : le composant rappelle cet endpoint
// automatiquement quand il a besoin d'un nouveau client_secret.
export async function POST() {
  return emettreAccountSession({
    account_onboarding: { enabled: true },
  });
}
