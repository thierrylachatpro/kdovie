// Popup de l'extension Kdovie — voir CLAUDE.md > "Extension navigateur
// Chrome" > "Onglet relais invisible pour l'authentification".
//
// Le cookie de session Supabase Auth du site est en SameSite=Lax (défaut de
// @supabase/ssr, jamais surchargé côté Kdovie) — un fetch cross-site depuis
// le popup (origine chrome-extension://) ne l'embarque jamais, confirmé en
// conditions réelles. Plutôt que d'assouplir ce cookie pour tout le site,
// chaque appel à l'API kdovie.com passe par un onglet caché sur
// kdovie.com : le fetch s'y exécute depuis une vraie page du site (même
// origine, cookie intact), le popup ne voit jamais le cookie lui-même.
import { extractProductFromPage } from "./content/extract.js";

const SITE_URL = "https://kdovie.com";
// Page hôte de l'onglet relais : stable, publique (jamais de redirection
// selon l'état de connexion, contrairement à `/`), légère. Son contenu
// affiché n'a aucune importance — seul son origine (kdovie.com) compte,
// pour que le fetch exécuté dedans soit same-site.
const PAGE_RELAIS = `${SITE_URL}/aide`;

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

// Onglet actif — celui de la fiche produit consultée, sert à l'extraction.
// Rien à voir avec l'onglet relais ci-dessous (kdovie.com), toujours
// distinct.
async function ongletActif() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function attendreChargementComplet(tabId) {
  return new Promise((resolve) => {
    function verifier() {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          resolve();
          return;
        }
        if (tab.status === "complete") {
          chrome.tabs.onUpdated.removeListener(ecouteur);
          resolve();
        }
      });
    }
    function ecouteur(idMisAJour, changeInfo) {
      if (idMisAJour === tabId && changeInfo.status === "complete") {
        chrome.tabs.onUpdated.removeListener(ecouteur);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(ecouteur);
    verifier();
  });
}

// Fonction autonome (voir content/extract.js pour la même contrainte) :
// injectée via chrome.scripting.executeScript dans l'onglet relais, elle
// s'exécute donc dans le contexte de la page kdovie.com — un fetch vers un
// chemin relatif y est same-origin, le cookie de session s'attache
// normalement quel que soit son SameSite.
function requeteDepuisLaPageKdovie(chemin, methode, corpsJson) {
  return fetch(chemin, {
    method: methode,
    credentials: "same-origin",
    headers: corpsJson ? { "Content-Type": "application/json" } : undefined,
    body: corpsJson || undefined,
  })
    .then(async (res) => ({ status: res.status, body: await res.json().catch(() => null) }))
    .catch((err) => ({ status: 0, body: null, erreurReseau: String(err) }));
}

// Ouvre l'onglet relais, y exécute la requête, le referme — toujours, même
// en cas d'erreur (le `finally` ne doit jamais laisser un onglet fantôme).
async function appelerApiKdovie(chemin, { methode = "GET", corps = null } = {}) {
  const tab = await chrome.tabs.create({ url: PAGE_RELAIS, active: false });
  try {
    await attendreChargementComplet(tab.id);
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: requeteDepuisLaPageKdovie,
      args: [chemin, methode, corps ? JSON.stringify(corps) : null],
    });
    return result;
  } finally {
    chrome.tabs.remove(tab.id).catch(() => {});
  }
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

  // Extraction depuis la page déjà ouverte (l'onglet actif, pas l'onglet
  // relais) — jamais un nouvel appel serveur, voir CLAUDE.md. Repli sur le
  // titre de l'onglet si l'injection échoue (page interne chrome://, PDF,
  // etc.) plutôt que de bloquer le popup.
  let extrait = { title: tab?.title ?? "", priceCents: null, imageUrl: null, sourceUrl: tab?.url ?? "" };
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractProductFromPage,
    });
    if (result) extrait = result;
  } catch {
    // Page non injectable — le formulaire reste utilisable, à remplir à la main.
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
      const reponse = await appelerApiKdovie("/api/extension/gift-items", {
        methode: "POST",
        corps: {
          eventId: selectListe.value,
          title: titre,
          priceCents: parsePrixEnCentimes(document.getElementById("champ-prix").value),
          imageUrl: extrait.imageUrl,
          sourceUrl: extrait.sourceUrl,
        },
      });

      if (!reponse || reponse.status !== 201) {
        throw new Error(reponse?.body?.error || "erreur_inconnue");
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
    const reponse = await appelerApiKdovie("/api/extension/me");
    if (!reponse || reponse.status !== 200) throw new Error("session_indisponible");
    session = reponse.body;
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
