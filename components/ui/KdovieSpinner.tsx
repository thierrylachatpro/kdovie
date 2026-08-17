// Spinner basé sur le pictogramme canonique du logo (voir CLAUDE.md >
// "Identité visuelle") — même SVG exact, juste mis en rotation. Ne pas
// réinventer un autre dessin.
export default function KdovieSpinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`animate-spin [transform-box:fill-box] [transform-origin:center] ${className}`}
    >
      <rect x="10" y="24" width="36" height="22" rx="2" fill="#E8734A" />
      <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
      <rect x="25" y="16" width="6" height="30" fill="#FFF8F0" />
      <path
        d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z"
        fill="#8BA888"
      />
      <path
        d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z"
        fill="#8BA888"
      />
    </svg>
  );
}
