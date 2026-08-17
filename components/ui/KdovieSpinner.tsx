// Spinner "ruban orbital" (maquette Claude Design "Logo animé.dc.html") :
// le logo reste fixe, un arc de ruban tourne autour en 1,4 s. Deux variantes
// de couleurs — voir CLAUDE.md > "Identité visuelle" pour le SVG canonique
// dont ceci dérive :
// - "light" (défaut) : anneau sage, couleurs du logo inchangées — pour un
//   fond clair (crème, blanc, tan...).
// - "dark" : anneau crème, boîte/ruban inversés (boîte crème, ruban corail)
//   — pour un fond plein corail, où les couleurs normales du logo se
//   fondraient dans le fond.
//
// `className` fixe la taille de la boîte prise en compte par le flex du
// bouton parent (donc sa hauteur ne bouge pas) ; le SVG lui-même est agrandi
// visuellement par-dessus via `scale`, qui n'affecte pas la mise en page.
export default function KdovieSpinner({
  className = "h-4 w-4",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const ringColor = variant === "dark" ? "#FFF8F0" : "#8BA888";
  const boxColor = variant === "dark" ? "#FFF8F0" : "#E8734A";
  const ribbonColor = variant === "dark" ? "#E8734A" : "#FFF8F0";

  return (
    <span className={`inline-block ${className}`}>
      <svg
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="block h-full w-full scale-150"
      >
        <g
          className="animate-spin"
          style={{ animationDuration: "1.4s", transformOrigin: "28px 28px" }}
        >
          <circle
            cx="28"
            cy="28"
            r="25"
            fill="none"
            stroke={ringColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="46 110"
          />
        </g>
        <g transform="translate(28 28) scale(.68) translate(-28 -28)">
          <rect x="10" y="24" width="36" height="22" rx="2" fill={boxColor} />
          <rect x="7" y="16" width="42" height="10" rx="2" fill="#F5B942" />
          <rect x="25" y="16" width="6" height="30" fill={ribbonColor} />
          <path
            d="M28 16C28 16 20 16 17 12C15 9.5 17 6 20 6C24 6 28 12 28 16Z"
            fill="#8BA888"
          />
          <path
            d="M28 16C28 16 36 16 39 12C41 9.5 39 6 36 6C32 6 28 12 28 16Z"
            fill="#8BA888"
          />
        </g>
      </svg>
    </span>
  );
}
