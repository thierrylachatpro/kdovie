export function initiales(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return "?";
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return mots
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase())
    .join("");
}
