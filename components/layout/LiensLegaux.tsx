import Link from "next/link";

// Trois pages légales, liées depuis le pied de page sur tout le site — voir
// CLAUDE.md > "Pages légales : mentions légales, CGU, CGV".
export default function LiensLegaux({ className }: { className?: string }) {
  return (
    <>
      <Link href="/mentions-legales" className={className}>
        Mentions légales
      </Link>
      <Link href="/cgu" className={className}>
        CGU
      </Link>
      <Link href="/cgv" className={className}>
        CGV
      </Link>
    </>
  );
}
