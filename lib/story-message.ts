// Phrase principale du visuel « story » (Instagram / TikTok), à la première
// personne puisque c'est l'organisateur qui publie. Choisie automatiquement
// selon le type de liste : rien à saisir. « Notre » pour les événements de
// couple / famille, « ma » sinon.
const MESSAGES: Record<string, string> = {
  naissance: "Bébé arrive bientôt ! Si vous voulez nous gâter, notre liste est par ici",
  anniversaire: "C'est bientôt mon anniversaire ! Une petite idée ? Ma liste est ici",
  mariage: "On se dit oui ! Merci de partager ce moment avec nous, voici notre liste",
  noel: "Le Père Noël a besoin d'un coup de main ? Voici ma liste",
  pot_depart: "Une nouvelle page commence ! Pour participer, c'est par ici",
  cremaillere: "On a enfin notre chez-nous ! Notre liste pour l'équiper est ici",
  bapteme: "Un beau jour se prépare ! Voici la liste pour le baptême",
};

const MESSAGE_PAR_DEFAUT = "Envie de me faire plaisir ? Ma liste est par ici";

export function storyMessage(type: string | null): string {
  return (type && MESSAGES[type]) || MESSAGE_PAR_DEFAUT;
}

// Ambiance du visuel story selon le type de liste : un grand emoji du thème
// et un fond dégradé chaleureux (toujours dans les tons de la marque).
export type StoryTheme = { emoji: string; fondHaut: string; fondBas: string };

const THEMES: Record<string, StoryTheme> = {
  naissance: { emoji: "🍼", fondHaut: "#FFF8F0", fondBas: "#E3EDE1" },
  anniversaire: { emoji: "🎂", fondHaut: "#FFF8F0", fondBas: "#FCE6B8" },
  mariage: { emoji: "💍", fondHaut: "#FFF8F0", fondBas: "#F9DCD2" },
  noel: { emoji: "🎄", fondHaut: "#FFF8F0", fondBas: "#F6D3C4" },
  pot_depart: { emoji: "🎉", fondHaut: "#FFF8F0", fondBas: "#FCE6B8" },
  cremaillere: { emoji: "🏡", fondHaut: "#FFF8F0", fondBas: "#E3EDE1" },
  bapteme: { emoji: "🕊️", fondHaut: "#FFF8F0", fondBas: "#E6EEF2" },
};

const THEME_PAR_DEFAUT: StoryTheme = { emoji: "✨", fondHaut: "#FFF8F0", fondBas: "#FBE3D2" };

export function storyTheme(type: string | null): StoryTheme {
  return (type && THEMES[type]) || THEME_PAR_DEFAUT;
}
