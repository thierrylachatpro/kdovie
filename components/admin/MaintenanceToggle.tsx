"use client";

import { useState, useTransition } from "react";
import { setMaintenanceMode } from "@/app/admin/actions";
import KdovieSpinner from "@/components/ui/KdovieSpinner";

// Bascule app_settings.maintenance_mode (migration 0020), lue par proxy.ts
// à chaque requête — voir CLAUDE.md > "Bouton admin pour basculer le mode
// maintenance". Confirmation en deux temps uniquement pour activer la
// maintenance (masque le site à tous les visiteurs) ; la désactivation
// n'a pas besoin de ce frein, elle ne fait que rendre le site visible.
//
// `onChange` optionnel : posé dans la colonne de gauche (AdminSidebar), qui
// affiche sa propre pastille d'état sur le bouton "Maintenance" — permet à
// ce parent de rester synchronisé sans dupliquer l'appel serveur.
export default function MaintenanceToggle({
  initialEnabled,
  onChange,
}: {
  initialEnabled: boolean;
  onChange?: (enabled: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [confirming, setConfirming] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    setErreur(null);
    startTransition(async () => {
      const result = await setMaintenanceMode(next);
      if (result.error) {
        setErreur(result.error);
        return;
      }
      setEnabled(next);
      setConfirming(false);
      onChange?.(next);
    });
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 p-5 ${
        enabled ? "border-[#F2C6AE] bg-[#F7D9C9]" : "border-[#F2DFC9] bg-white"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-heading text-lg font-bold text-[#4A3529]">
            {enabled ? "Site en maintenance" : "Site en ligne"}
          </span>
          <span
            className={`h-2.5 w-2.5 rounded-full ${enabled ? "bg-[#A8431F]" : "bg-sauge"}`}
            aria-hidden="true"
          />
        </div>
        <p className="text-sm text-[#8A7263]">
          {enabled
            ? "Les visiteurs voient la page d'attente. Le contournement par jeton reste actif."
            : "Les visiteurs voient le site normalement."}
        </p>
      </div>

      <div className="flex flex-none flex-wrap items-center gap-2.5">
        {enabled ? (
          <button
            type="button"
            onClick={() => handleToggle(false)}
            disabled={isPending}
            className="font-heading inline-flex items-center gap-2 rounded-2xl bg-sauge px-4 py-2.5 text-[14px] font-bold text-creme hover:bg-sauge-dark disabled:opacity-60"
          >
            {isPending && <KdovieSpinner className="h-3.5 w-3.5" variant="dark" />}
            Remettre le site en ligne
          </button>
        ) : !confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-2xl bg-[#F7D9C9] px-4 py-2.5 text-[14px] font-semibold text-[#A8431F] hover:bg-[#F2C6AE]"
          >
            Passer en maintenance
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8A7263]">Masquer le site à tous les visiteurs ?</span>
            <button
              type="button"
              onClick={() => handleToggle(true)}
              disabled={isPending}
              className="font-heading inline-flex items-center gap-2 rounded-2xl bg-corail px-4 py-2.5 text-[14px] font-bold text-creme hover:bg-[#D45F37] disabled:opacity-60"
            >
              {isPending && <KdovieSpinner className="h-3.5 w-3.5" variant="dark" />}
              Oui
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="text-sm font-semibold text-[#8A7263]"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
      {erreur && <p className="mt-1 w-full text-sm text-corail-dark">{erreur}</p>}
    </div>
  );
}
