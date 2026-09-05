// Popup de l'extension Kdovie — voir CLAUDE.md > "Extension navigateur
// Chrome". Authentification par session partagée avec kdovie.com (aucun
// flux de connexion propre à l'extension) : si `/api/extension/me` répond
// non connecté, on invite juste à se connecter sur le site.
import { extractProductFromPage } from "./content/extract.js";

const SITE_URL = "https://kdovie.com";

const etats = {
  chargement: document.getElementById("etat-chargement"),
  nonConnecte: document.getElementById("etat-non-connecte"),
  formulaire: document.getElementById("etat-formulaire"),
  succes: document.getElementById("etat-succes"),
  erreur: document.getElementById("etat-erreur"),
};

function afficherEtat(nom) {
  for (const [cle, element] of Object.entries(etats)) {
    element.hidden = cle !== nom;
  }
}

function afficherErreurBloquante(message) {
  document.getElementById("texte-erreur-bloquante").textContent = message;
  afficherEtat("erreur");
}

// Onglet actif — sert à la fois pour l'injection de l'extraction et comme
// repli de titre (l'onglet a toujours un titre, même sans données produit).
async function ongletActif() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function verifierSession() {
  const res = await fetch(`${SITE_URL}/api/extension/me`, { credentials: "include" });
  if (!res.ok) throw new Error("session_indisponible");
  return res.json();
}

function formaterPrix(centimes) {
  if (centimes === null || centimes === undefined) return "";
  return (centimes / 100).toFixed(2).replace(".", ",");
}

// Même conversion que le reste du produit (AjouterArticleForm) : virgule ou
// point, jamais de valeur inventée si le champ est vide ou illisible.
function parsePrixEnCentimes(saisie) {
  const brut = saisie.trim();
  if (!brut) return null;
  const valeur = parseFloat(brut.replace(",", "."));
  return Number.isFinite(valeur) && valeur >= 0 ? Math.round(valeur * 100) : null;
}

async function initFormulaire(listes, tab) {
  const selectListe = document.getElementById("champ-liste");
  selectListe.innerHTML = "";
  for (const liste of listes) {
    const option = document.createElement("option");
    option.value = liste.id;
    option.dataset.slug = liste.slug;
    option.textContent =
      liste.status === "brouillon" ? `${liste.name} (brouillon)` : liste.name;
    selectListe.appendChild(option);
  }

  afficherEtat("formulaire");

  // Extraction depuis la page déjà ouverte — jamais un nouvel appel serveur,
  // voir CLAUDE.md. Repli sur le titre de l'onglet si l'injection échoue
  // (page interne chrome://, PDF, etc.) plutôt que de bloquer le popup.
  let extrait = { title: tab?.title ?? "", priceCents: null, imageUrl: null, sourceUrl: tab?.url ?? "" };
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractProductFromPage,
    });
    if (result) extrait = result;
  } catch {
    // Page non injectable (chrome://, Web Store, PDF visualisé nativement…) —
    // le formulaire reste utilisable, à remplir à la main.
  }

  document.getElementById("champ-titre").value = extrait.title ?? "";
  document.getElementById("champ-prix").value = formaterPrix(extrait.priceCents);

  const image = document.getElementById("apercu-image");
  const imageVide = document.getElementById("apercu-image-vide");
  if (extrait.imageUrl) {
    image.src = extrait.imageUrl;
    image.hidden = false;
    imageVide.hidden = true;
  } else {
    image.hidden = true;
    imageVide.hidden = false;
  }

  document.getElementById("bouton-ajouter").onclick = async () => {
    const erreurEl = document.getElementById("erreur-formulaire");
    erreurEl.hidden = true;

    const titre = document.getElementById("champ-titre").value.trim();
    if (!titre) {
      erreurEl.textContent = "Le titre est obligatoire.";
      erreurEl.hidden = false;
      return;
    }

    const boutonAjouter = document.getElementById("bouton-ajouter");
    boutonAjouter.disabled = true;
    boutonAjouter.textContent = "Ajout en cours…";

    const optionChoisie = selectListe.options[selectListe.selectedIndex];
    try {
      const res = await fetch(`${SITE_URL}/api/extension/gift-items`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectListe.value,
          title: titre,
          priceCents: parsePrixEnCentimes(document.getElementById("champ-prix").value),
          imageUrl: extrait.imageUrl,
          sourceUrl: extrait.sourceUrl,
        }),
      });

      if (!res.ok) {
        const corps = await res.json().catch(() => ({}));
        throw new Error(corps.error || "erreur_inconnue");
      }

      document.getElementById("lien-voir-liste").href =
        `${SITE_URL}/compte/evenements/${optionChoisie.dataset.slug}`;
      afficherEtat("succes");
    } catch {
      erreurEl.textContent = "L'ajout a échoué, réessayez.";
      erreurEl.hidden = false;
      boutonAjouter.disabled = false;
      boutonAjouter.textContent = "Ajouter à ma liste";
    }
  };
}

async function demarrer() {
  afficherEtat("chargement");
  const tab = await ongletActif();

  let session;
  try {
    session = await verifierSession();
  } catch {
    afficherErreurBloquante(
      "Impossible de contacter Kdovie pour le moment. Vérifiez votre connexion et réessayez.",
    );
    return;
  }

  if (!session.connecte) {
    afficherEtat("nonConnecte");
    return;
  }

  if (!session.listes || session.listes.length === 0) {
    afficherErreurBloquante("Vous n'avez pas encore de liste. Créez-en une sur Kdovie d'abord.");
    return;
  }

  await initFormulaire(session.listes, tab);
}

demarrer();
