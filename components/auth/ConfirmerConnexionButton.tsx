"use client";

import { useFormStatus } from "react-dom";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

export default function ConfirmerConnexionButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-heading inline-flex items-center justify-center gap-2.5 rounded-2xl bg-corail px-6.5 py-4 text-base font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
    >
      {pending && <KdovieSpinner className="h-4.5 w-4.5" variant="dark" />}
      {pending ? "Connexion en cours…" : "Me connecter"}
    </button>
  );
}
