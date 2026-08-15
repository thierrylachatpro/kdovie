"use client";

import { useState } from "react";

export default function CopierLienButton({ lien }: { lien: string }) {
  const [copie, setCopie] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(lien);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      className="rounded-lg bg-jaune px-5 py-2.5 text-sm font-medium text-corail-dark"
    >
      {copie ? "Lien copié !" : "Copier le lien"}
    </button>
  );
}
