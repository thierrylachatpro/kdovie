import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageLegale from "@/components/layout/PageLegale";
import ContactForm from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Kdovie",
};

export default async function ContactPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PageLegale title="Contact" estConnecte={Boolean(user)}>
      <p className="text-[16px] leading-relaxed text-[#5C4436]">
        Une question, un problème, une suggestion ? Écrivez-nous, on vous répond directement à
        l&apos;adresse indiquée ci-dessous.
      </p>
      <ContactForm />
    </PageLegale>
  );
}
