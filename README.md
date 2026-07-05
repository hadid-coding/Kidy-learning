# 🌱 Kidy — Jeux éducatifs calmes pour les 2–4 ans

Une plateforme de jeux éducatifs pensée pour les tout-petits (conçue pour Alia, 3 ans 💚),
avec une approche scientifique du développement de l'enfant et **zéro mécanisme de
distraction** : pas de publicité, pas de musique, pas de contenu rapide ou clignotant,
pas de récompenses excitantes.

**Application 100 % statique** : aucun serveur, aucune dépendance, aucune donnée
collectée. Ouvrez `index.html` dans un navigateur (ou hébergez sur GitHub Pages)
et ça fonctionne, même hors-ligne.

## Les trois langues 🇸🇦 🇬🇧 🇫🇷

Le choix se fait au tout début : **العربية** (avec interface droite-à-gauche complète),
**English**, **Français**. Chaque langue est un parcours totalement séparé — consignes
vocales, textes et progression indépendants.

## Les 14 jeux fondamentaux

Chaque domaine a été choisi parce qu'il est un pilier du développement cognitif à 3 ans :

| Jeu | Compétence développée |
|---|---|
| 🎨 Les couleurs | discrimination visuelle, vocabulaire |
| 🔷 Les formes | pré-géométrie, catégorisation |
| 🔢 Les nombres | dénombrement, sens du nombre (1→10) |
| 🔤 Les lettres *(V2)* | reconnaissance de l'alphabet (arabe/latin), conscience du premier son |
| 🐘 Les animaux | vocabulaire, connaissance du monde |
| 🚒 Les véhicules *(V2)* | métiers et services (pompiers, police…), fonction des engins, sons réels animés |
| 🐻 Grand et petit | comparaison, sériation (pré-maths) |
| 🍃 La mémoire | mémoire de travail, attention |
| 🧩 Le puzzle | motricité fine, rotation mentale (glisser-déposer) |
| 🖼️ Le puzzle photo *(V2)* | reconstruire une image en 4 puis 9 morceaux (perception visuelle globale, image fantôme en guide) |
| 🦋 Les suites | logique, raisonnement par motifs (pré-maths) |
| 🍳 La cuisine *(V2)* | séquençage (suivre une recette), cuisson animée sur plaque, puis le plat est servi à table et l'avatar de l'enfant le mange bouchée par bouchée |
| 🖍️ Le dessin *(V2)* | coloriage guidé (toucher-remplir), puis dessin libre au doigt ; vocabulaire des couleurs |
| 👗 La garde-robe *(V2)* | jeu symbolique (princesse, super-héros…) : habiller au miroir, **nettoyer les vêtements en frottant les taches** (vie pratique Montessori), s'habiller selon la météo et l'occasion |

### Progression pédagogique : associer → nommer → appliquer

Chaque jeu a **3 niveaux** suivant la même échelle d'apprentissage :

- **Niveau 1 — Associer** : la cible est montrée ET dite (l'enfant fait correspondre).
- **Niveau 2 — Nommer** : la cible est seulement dite, avec plus de choix (compréhension).
- **Niveau 3 — Appliquer** : transfert vers le monde réel (« De quelle couleur est la
  banane ? », « Qui vit dans l'eau ? », suites à 3 éléments…).

Le niveau suivant se débloque quand le précédent est terminé (une ⭐ par niveau).

## L'approche anti-distraction (le cœur du projet)

Conçue contre les problèmes modernes liés aux écrans (surstimulation, perte de
concentration façon « shorts ») :

- **Une seule tâche à l'écran**, jamais de compte à rebours, jamais de chronomètre.
- **Rythme lent et prévisible** : transitions douces (300–500 ms), rien ne clignote,
  rien ne bouge sans raison.
- **Sons naturels uniquement**, synthétisés en direct (Web Audio) : goutte d'eau pour
  une bonne réponse, petit toc de bois doux pour « essaie encore » (jamais punitif),
  chants d'oiseaux en fin de niveau. **Aucune musique, aucun jingle, aucun fichier audio.**
- **Pas d'échec possible** : une erreur = un son doux + on réessaie. La réussite n'est
  jamais bloquée, la frustration reste basse, la persévérance est encouragée.
- **Consignes parlées** (synthèse vocale du navigateur, débit ralenti) — l'enfant
  n'a pas besoin de savoir lire ; le bouton 🔊 permet de réécouter à volonté.
- **Rappel de pause** après 20 min (réglable 15/20/30/jamais), aligné sur les
  recommandations pédiatriques (< 1 h d'écran/jour à 3 ans, accompagné d'un adulte).
- **Palette apaisée** : fond crème, couleurs douces, pas de blanc éclatant ni de néons.
- **Cibles tactiles géantes** (≥ 110 px) adaptées aux petits doigts, glisser-déposer
  très tolérant dans le puzzle.

## 👨‍👩‍👧 Espace parents

Accessible via un bouton discret **protégé par un appui long de 3 secondes**
(infranchissable pour un enfant de 3 ans). On y règle :

- le **prénom de l'enfant** (utilisé dans les félicitations vocales) ;
- l'**avatar de l'enfant** *(V2)* : peau, coiffure (dont hijab), couleur — un
  personnage simple et fini, **sans boutique ni objets à débloquer** : c'est de
  l'identité, pas de la récompense. L'enfant l'habille ensuite lui-même dans le
  jeu Garde-robe, et le retrouve partout (accueil, félicitations, repas servi) ;
- 🎙️ **votre voix** *(V2)* : enregistrez « Bravo ! », « Essaie encore », la fin de
  niveau et l'annonce de pause **avec votre propre voix** — Kidy les joue à la
  place de la voix de synthèse. Entendre papa/maman est plus chaleureux et plus
  efficace pédagogiquement. Les enregistrements restent **sur l'appareil**
  (IndexedDB), rien n'est envoyé sur internet ; un jeu d'enregistrements par langue ;
- la voix de synthèse, les sons, la durée avant pause, la langue, la remise à zéro,
  et le résumé de la méthode.

## 📲 Installer sur tablette / téléphone (V2 — PWA hors-ligne)

Kidy est une **Progressive Web App** : une fois installée, elle se lance comme une
vraie application, **en plein écran et sans internet**.

Depuis `https://hadid-coding.github.io/Kidy-learning` :

- **iPad / iPhone (Safari)** : bouton **Partager** (carré avec flèche) →
  **« Sur l'écran d'accueil »** → Ajouter. L'icône 🌱 Kidy apparaît.
- **Tablette / téléphone Android (Chrome)** : menu **⋮** →
  **« Installer l'application »** (ou la bannière d'installation qui s'affiche).

Ouvrez l'application une première fois avec internet ; ensuite tout fonctionne
hors-ligne (le service worker met tous les fichiers en cache et se met à jour
tout seul quand une nouvelle version est publiée).

> ⚠️ Sur iPad, utilisez bien **Safari** pour l'installation (exigence d'Apple).

## Lancer / héberger

```bash
# en local : ouvrez simplement index.html, ou
python3 -m http.server 8080   # puis http://localhost:8080
```

Pour GitHub Pages : Settings → Pages → déployer depuis la branche, dossier racine.
(Déjà en ligne : https://hadid-coding.github.io/Kidy-learning)

> 💡 Conseil : la synthèse vocale arabe dépend des voix installées sur l'appareil.
> Sur Android/iOS elle est généralement disponible ; sinon les consignes restent
> visibles à l'écran et les sons naturels fonctionnent partout.

## Structure du code

```
index.html             point d'entrée (aucun build nécessaire)
manifest.webmanifest   installation PWA (icône, plein écran)
sw.js                  service worker : cache hors-ligne + mises à jour
icons/                 icônes de l'application
css/style.css          design apaisé, RTL, animations douces
js/i18n.js             traductions complètes ar / en / fr
js/audio.js            sons naturels + sons de véhicules synthétisés,
                       voix de synthèse, enregistrements parents (IndexedDB)
js/avatar.js           l'avatar SVG de l'enfant (base + tenues)
js/games.js            les 13 jeux et leur pédagogie à 3 niveaux
js/app.js              navigation, progression, espace parents, pauses, PWA
```
