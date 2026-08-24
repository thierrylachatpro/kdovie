"use client";

import { useFormStatus } from "react-dom";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

export default function ConfirmerConnexionButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-heading inline-flex w-full items-center justify-center gap-2.5 rounded-[20px] bg-corail py-[19px] text-lg font-bold text-creme disabled:opacity-60"
    >
      {pending && <KdovieSpinner className="h-5 w-5" variant="dark" />}
      {pending ? "Connexion en cours…" : "Me connecter"}
    </button>
  );
}
