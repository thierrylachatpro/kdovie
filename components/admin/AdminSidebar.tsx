"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import MaintenanceToggle from "@/components/admin/MaintenanceToggle";

const LIENS = [
  { href: "/admin/organisateurs", label: "Organisateurs" },
  { href: "/admin/listes", label: "Listes" },
  { href: "/admin/cotisations", label: "Cotisations" },
] as const;

// Colonne de navigation partagée par tout /admin/* — voir CLAUDE.md >
// "Refonte du dashboard super-administrateur". Le bouton "Maintenance"
// n'est pas un lien : il ouvre MaintenanceToggle dans un popover, sans
// quitter la page courante.
export default function AdminSidebar({
  initialMaintenanceEnabled,
}: {
  initialMaintenanceEnabled: boolean;
}) {
  const pathname = usePathname();
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(initialMaintenanceEnabled);
  const [popoverOuvert, setPopoverOuvert] = useState(false);

  return (
    <aside className="flex flex-none flex-col gap-1 border-b-2 border-[#F2DFC9] bg-white p-5 sm:w-64 sm:border-r-2 sm:border-b-0">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-2.5">
        <svg
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="h-7 w-7"
        >
          <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
          <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
          <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
          <path d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z" fill="#8BA888" />
          <path d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z" fill="#8BA888" />
        </svg>
        <span className="font-heading text-lg font-bold text-corail">Admin</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {LIENS.map((lien) => {
          const actif = pathname === lien.href || pathname.startsWith(`${lien.href}/`);
          return (
            <Link
              key={lien.href}
              href={lien.href}
              className={`rounded-xl px-4 py-2.5 text-[15px] font-semibold ${
                actif ? "bg-[#F7E7D6] text-corail-dark" : "text-[#5C4436] hover:bg-[#F7E7D6]/60"
              }`}
            >
              {lien.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-4">
        <button
          type="button"
          onClick={() => setPopoverOuvert((current) => !current)}
          className="flex w-full items-center gap-2.5 rounded-xl bg-[#F7E7D6]/60 px-4 py-2.5 text-[15px] font-semibold text-[#5C4436] hover:bg-[#F7E7D6]"
        >
          <span
            className={`h-2.5 w-2.5 flex-none rounded-full ${
              maintenanceEnabled ? "bg-[#A8431F]" : "bg-sauge"
            }`}
            aria-hidden="true"
          />
          Maintenance
        </button>

        {popoverOuvert && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setPopoverOuvert(false)}
              aria-hidden="true"
            />
            <div className="absolute bottom-full left-0 z-20 mb-2 w-90 max-w-[calc(100vw-2.5rem)]">
              <MaintenanceToggle
                initialEnabled={maintenanceEnabled}
                onChange={setMaintenanceEnabled}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
