import type { Metadata } from "next";
import type { ReactNode } from "react";

// Espace organisateur : derrière l'auth (Googlebot est redirigé vers
// /connexion et n'y accède pas), mais on pose noindex par sécurité — ceinture
// et bretelles, aucune page de /compte/* n'a vocation à être indexée.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CompteLayout({ children }: { children: ReactNode }) {
  return children;
}
