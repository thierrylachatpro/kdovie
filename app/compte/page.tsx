import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventTypeIcon, eventTypeLabel } from "@/lib/event-types";
import DeconnexionButton from "@/components/auth/DeconnexionButton";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("events")
      .select("id, type, name, slug, event_date")
      .eq("organizer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-corail">
            {profile?.display_name
              ? `Bonjour ${profile.display_name}`
              : "Vous êtes connecté"}
          </h1>
          <p className="text-sm text-gris">{user.email}</p>
        </div>
        <DeconnexionButton />
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">
            Vos événements
          </h2>
          <Link
            href="/compte/evenements/nouveau"
            className="rounded-lg bg-jaune px-4 py-2 text-sm font-medium text-corail-dark"
          >
            + Nouvel événement
          </Link>
        </div>

        {events && events.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/compte/evenements/${event.slug}`}
                  className="flex flex-col gap-2 rounded-xl border border-gris/20 bg-white p-5 text-left transition hover:border-corail"
                >
                  <span className="text-3xl">{eventTypeIcon(event.type)}</span>
                  <span className="font-heading font-bold text-foreground">
                    {event.name}
                  </span>
                  <span className="text-xs text-gris">
                    {eventTypeLabel(event.type)}
                    {event.event_date
                      ? ` · ${new Date(event.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gris/30 px-6 py-12 text-center">
            <p className="text-sm text-gris">
              Vous n&apos;avez pas encore d&apos;événement.
            </p>
            <Link
              href="/compte/evenements/nouveau"
              className="rounded-lg bg-jaune px-5 py-2.5 text-sm font-medium text-corail-dark"
            >
              Créer mon premier événement
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
