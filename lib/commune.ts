// "Lyon 3e Arrondissement" / "Paris 1er Arrondissement" → "Lyon" / "Paris".
// Utilisé à l'enregistrement de la ville (profil) comme dans la recherche,
// pour qu'un organisateur d'un arrondissement soit trouvé en tapant "Lyon".
export function nomCommuneSansArrondissement(nom: string): string {
  return nom.replace(/\s+\d+(er|e)\s+Arrondissement$/i, "").trim();
}
