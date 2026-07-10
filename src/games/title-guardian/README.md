# Easter egg : Title Guardian

Mini-jeu caché dans le header, déclenché depuis le logo `pebrian.fr/`. Documente le
fonctionnement complet pour pouvoir le faire évoluer sans redécouvrir la logique.

Ce dossier (`src/games/title-guardian/`) est un jeu parmi d'autres, potentiellement,
dans `src/games/`. Le jeu actif est choisi via la variable d'environnement
`PUBLIC_EASTER_EGG_GAME` (voir `.env.example`), lue dans `src/config.ts`
(`site.easterEggGame`) et résolue par le petit registre `games`/`getGame()` défini
dans `src/components/Header.astro`. Ajouter un nouveau jeu : créer
`src/games/<clé>/<Composant>.astro` sur le même modèle que celui-ci (un `<script>`
autonome enregistré sur `astro:page-load`, un `<style is:global>` s'il cible des
éléments du header), l'importer dans `Header.astro` et l'ajouter à l'objet `games`.

Fichiers concernés :
- `src/games/title-guardian/TitleGuardian.astro` — toute la logique du jeu (canvas +
  état) et tout son style visuel (glitch, pouvoir, bouclier, victoire...).
- `src/components/Header.astro` — structure générique du logo (`#site-logo`,
  `#logo-base`, `#logo-slash`), la barre de mèche générique (`#fuse-bar`/
  `#fuse-flame`, positionnée ici car imbriquée dans l'ancre du logo), `<nav>` comme
  conteneur relatif du canvas, `#nav-page-links` comme cible du découpage des liens
  de menu en lettres, et le registre `games`/`getGame()` qui sélectionne le jeu actif.

## Concept général

Le titre du site (`pebrian.fr/`) "glitche" périodiquement. Si le visiteur survole
le logo *pendant* ce glitch, le `/` final se transforme en bouclier vertical et une
pieuvre 🐙 apparaît pour attaquer le titre en lui envoyant les lettres du menu, puis
des lasers. Le visiteur doit défendre le titre en bougeant la souris (le bouclier
suit verticalement le curseur). Défaite = titre détruit lettre par lettre, tombées
au sol, pour toujours. Victoire = bouclier transformé en médaille 🏅, titre restauré.

## Cycle de vie et anti-triche

- **Minuteur de glitch** (`GLITCH_INTERVAL = 15000` ms) : vit en portée *module*
  (hors de la callback `astro:page-load`), car le script n'est jamais réévalué
  entre deux navigations SPA — seule cette portée module survit aux changements
  de page. Un changement de page ne réinitialise donc jamais le minuteur.
- **Anti-camping** : survoler le logo alors qu'il n'est *pas* en train de glitcher
  relance le minuteur de 15s depuis zéro (`restartGlitchTimer()`). Impossible de
  garder la souris dessus en permanence pour forcer le déclenchement.
- **Déclenchement du jeu** : survoler le logo *pendant* la fenêtre de glitch
  (`GLITCH_ANIM_DURATION = 1300` ms) appelle `startGame()`.
- **`gameOverForever`** : dès qu'une partie se termine (victoire ou défaite), ce
  flag passe à `true` et le minuteur de glitch (`glitchTimer`) est définitivement
  arrêté (`clearInterval`) — plus aucun glitch, plus aucune partie possible pour
  le reste de la session de navigation (jusqu'à un rechargement complet de page,
  qui réinitialise la portée module).
- **Pause (souris hors du canvas)** : `onMouseMove`/`onCanvasLeave` sont
  écoutés directement sur le canvas (pas sur `window`/`document`) : une
  tentative précédente avait déplacé cette écoute au niveau fenêtre pour
  éviter qu'une esquive de laser (mouvement vertical ample) ne sorte
  trivialement du canvas fin — mais la nav étant `sticky top-0`, quitter par
  le haut sort réellement de la fenêtre du navigateur (donc détecté), alors
  que quitter par le bas atterrit simplement plus bas dans la page, toujours
  "dans" la fenêtre (donc jamais détecté) : la pause ne se déclenchait qu'en
  haut, jamais en bas. Le canvas `mouseleave`, lui, se déclenche
  symétriquement quel que soit le côté par lequel on en sort.
  `onCanvasLeave()` appelle `pauseGame()` immédiatement : la boucle
  `requestAnimationFrame` est arrêtée et l'action différée en cours
  (`nextActionTimeout`, ex. le prochain laser ou la prochaine lettre) est
  annulée en mémorisant le temps restant (`pendingRemaining`). Rien n'est
  réinitialisé — projectiles, débris, progression restent en l'état. Dès que
  la souris revient sur le canvas (`onMouseMove` re-déclenché),
  `resumeGame()` relance la boucle (`lastTs` remis à 0 pour éviter un `dt`
  géant) et reprogramme l'action différée avec le temps restant exact via
  `scheduleAction()`, plutôt que de la relancer depuis zéro ou de la perdre.
  Sortir trivialement de ce canvas fin en esquivant un laser n'est plus un
  problème depuis que la sortie déclenche une vraie pause plutôt qu'une
  réinitialisation silencieuse (c'était l'ancien bug : sortie du canvas →
  délai de grâce de 1500ms → réinitialisation silencieuse, sans victoire ni
  défaite).

## Déroulement d'une partie (`startGame`)

1. Mesure la nav (`measureLayout()`) : largeur/hauteur du canvas = celles de
   `<nav>`, position du bouclier (`SHIELD_X`) = juste après le logo.
2. Découpe les 4 liens du menu en `<span>` par lettre (`splitMenuIntoLetters()`),
   dans l'ordre du DOM — la pieuvre les tirera dans cet ordre, en vidant le menu
   de gauche à droite.
3. Découpe `pebrian.fr` (sans le `/`) en `<span>` par lettre (`logoChars`) — chaque
   lettre perdue en jeu correspond à une de ces spans masquée (`display: none`).
4. Le `/` (`#logo-slash`) est déplacé dans `#game-area`, devient le bouclier
   (`.slash-shield`, texte `|`), positionné en `left: SHIELD_X`, `top` suit la
   souris verticalement (`onMouseMove`).
5. La mèche (`#fuse-bar`/`#fuse-flame`) apparaît à pleine longueur.
6. Lance la chaîne d'événements (voir plus bas) et la boucle `requestAnimationFrame`.

## Chaîne d'événements — **aucun minuteur global fixe**

Le jeu ne repose sur aucun `setInterval` ni décompte de durée totale. Chaque
action déclenche la suivante via `setTimeout(..., délai_aléatoire)`, stocké dans
`nextActionTimeout` (une seule référence active à la fois, annulable).

### Phase "dodge" (salves de lettres)

- `fireNextLetterInSalvo()` : tire la lettre courante du menu vers le titre
  (vitesse de base calculée sur `TRAVEL_TIME_MS` et la distance à parcourir),
  avance `nextLetterIndex`, met à jour la mèche (`updateFuseProgress()` —
  proportionnelle aux lettres de menu déjà tirées, pas au temps écoulé).
  - **Accélération par salve, pas par lettre** : une seule fraction
    d'accélération aléatoire (`currentSalvoAccelFraction`, entre
    `SALVO_ACCEL_FRACTION_MIN` et `SALVO_ACCEL_FRACTION_MAX`) est tirée au
    début de chaque mot (`isFirstOfWord`) et réutilisée pour toutes les
    lettres de ce mot — plutôt qu'une valeur différente à chaque lettre, ce
    qui rendait le rythme incohérent au sein d'un même mot.
  - Si c'est la dernière lettre d'un mot (mais pas la toute dernière du menu) :
    programme la lettre suivante après un délai aléatoire entre `WORD_GAP_MIN`
    (700ms) et `WORD_GAP_MAX` (1700ms) — pause "entre deux mots".
  - Sinon (lettre au milieu d'un mot) : délai fixe court `SALVO_LETTER_INTERVAL`
    (130ms) — rafale rapide à l'intérieur d'un mot.
  - Si c'est la toute dernière lettre du menu entier : programme
    `startLaserSequence()` après un délai `WORD_GAP_MIN`–`WORD_GAP_MAX`.
- La pieuvre (`octopusPos()`) se positionne devant la prochaine lettre à tirer
  (`nextTargetPos()`), avec un bobbing vertical sinusoïdal
  (`OCTOPUS_BOB_AMPLITUDE = 16`) — donc elle se déplace visiblement pendant
  qu'elle tire une salve, puisque sa cible change à chaque lettre.
- Un projectile intercepté par le bouclier (zone `SHIELD_X ± 6` en x, `paddleY`
  ± hauteur du bouclier en y) est **dévié** (`deflected = true`) : rebond à 45°
  (haut ou bas aléatoire) avec vitesse conservée, puis fondu (`fadeAlpha` décroît
  sur `DEFLECT_FADE_MS = 450` ms) — pas de disparition instantanée.
- Un projectile non intercepté qui dépasse `SHIELD_X` déclenche `flashHit()` (flash
  rouge bref du logo) puis `loseTitleLetter()`.

### Phase "laser" (3 tirs séquentiels)

- `startLaserSequence()` : remesure la nav (`measureLayout()`) pour garantir un
  rayon qui couvre toute la largeur réelle du canvas — `laserOriginX = W - 20`,
  fixe, **indépendant** de la position (épuisée) de la dernière lettre du menu.
  C'est le correctif du bug "laser trop court" : avant, l'origine du laser
  dépendait de `nextTargetPos()` qui retombait sur un fallback `{x: W - 24, ...}`
  mais recalculé indirectement via la même chaîne que le ciblage de lettres — pas
  fiable une fois le menu vidé. Désormais `startLaserSequence()` fixe
  explicitement `laserOriginX`/`laserBobCenter` dès son entrée.
- `fireNextLaser()` : active le laser (`laserActive = true`) à la hauteur
  actuelle de la pieuvre. **Le laser persiste indéfiniment** une fois tiré — pas
  de durée fixe.
  - S'il est **bloqué** par le bouclier (même zone de collision verticale que les
    projectiles) : s'arrête net (`laserActive = false`), incrémente
    `laserShotsFired`. Si `laserShotsFired === LASER_COUNT` (3) → `win()`.
    Sinon → programme le laser suivant après un délai `LASER_GAP_MIN`–`LASER_GAP_MAX`
    (700–1600ms).
  - S'il n'est **pas bloqué** : fait fondre une lettre du titre toutes les
    `LASER_MELT_INTERVAL` (260ms) tant qu'il reste actif (`flashHit()` +
    `loseTitleLetter()` à chaque intervalle).
- La pieuvre reste **immobile** pendant qu'un laser est activement tiré
  (`laserActive`), mais continue de "bobber" verticalement entre deux tirs.
- **Point d'impact dynamique** (`draw()`) : le rayon s'arrête soit sur le
  bouclier (`SHIELD_X`, s'il intercepte), soit sur la lettre qu'il est
  réellement en train de faire fondre (`currentLetterImpactPos()`, la lettre
  la plus à droite encore visible). Le titre rétrécissant par la droite au fil
  de la fonte alors que `SHIELD_X` reste fixe, les deux points divergent
  visiblement dès qu'une lettre a fondu — voulu, pour que le rayon paraisse
  toucher réellement le titre plutôt qu'un point figé dans le vide.
- **Effet de puissance** : le faisceau est dessiné en 3 couches (halo large
  pulsant, couche intermédiaire, cœur blanc-chaud fin) avec une légère
  pulsation temporelle (`flicker`), plutôt qu'un simple trait statique.
- **Effet de "soudure"** (`drawWeldSparks()`) : tant qu'une lettre est en train
  de fondre (rayon non bloqué), des éclairs lumineux sont régénérés
  aléatoirement à chaque frame autour d'un point chaud central, à l'endroit
  exact de l'impact — d'où l'effet de crépitement. Quand le rayon est stoppé
  net par le bouclier, le même effet s'affiche brièvement (`shieldImpactTimer`,
  `SHIELD_IMPACT_MS`) : `laserActive` retombe à `false` le frame même du
  blocage, donc sans ce minuteur dédié l'impact ne serait jamais visible.

## Lettres perdues : rendu canvas (pas DOM)

Contrairement à une première implémentation DOM (clones `<span class="letter-debris">`
positionnés en `position: fixed`, jugée peu fiable), les lettres touchées du titre
sont désormais gérées **entièrement dans le canvas**, dans le même repère de
coordonnées que les projectiles et le laser :

- `loseTitleLetter()` masque la `<span>` du titre concernée (`display: none`) et
  pousse un objet dans `fallingDebris` (position de départ = position de la lettre
  au moment de l'impact, convertie en coordonnées canvas via `canvasLocal()`).
- `updateDebris(dt)` applique une gravité simple (`GRAVITY = 0.35`, incrément de
  vitesse verticale par frame) jusqu'à ce que la lettre atteigne le sol du canvas
  (`y = H - 4`), où elle se fige (`resting = true`) et y reste **définitivement**.
- `drawDebris()` dessine chaque lettre tombée (police monospace, couleur grise
  discrète) à chaque frame, qu'une partie soit en cours ou non.
- En cas de défaite (`lose()`), `#game-area` **n'est plus masqué** (contrairement à
  avant) : un dernier appel manuel à `draw()` est fait après l'arrêt de la boucle
  `requestAnimationFrame`, pour que les lettres tombées restent visibles en
  permanence, posées sous le titre. Seule `win()` masque `#game-area` et vide
  `fallingDebris`.

## Fin de partie

### Défaite (`lose()`)

- Se déclenche dès que `remainingCount` (lettres restantes du titre) atteint 0,
  que ce soit via un projectile manqué ou un laser non bloqué.
- `gameOverForever = true`, minuteur de glitch définitivement arrêté.
- Le bouclier est détaché du DOM du jeu vers `document.body`
  (`detachShieldToBody()`, capture sa position écran avec `getBoundingClientRect()`
  puis `position: fixed` pour continuer d'exister indépendamment de `#game-area`),
  puis tombe et s'estompe (`fallAndFade()`, opacité finale 0.5) — **définitivement**,
  aucune restauration après une défaite.
- `showRipMessage()` insère un message inline juste après le titre : "RIP titre
  bien-aimé 😢" en français, "RIP beloved title 😢" en anglais — détection via
  `document.documentElement.lang !== 'en'` (défaut FR).
- Dernier rendu du canvas pour figer les lettres tombées visibles en permanence.

### Victoire (`win()`)

- Se déclenche quand les 3 lasers ont été bloqués (`laserShotsFired === LASER_COUNT`).
- `gameOverForever = true`, minuteur de glitch définitivement arrêté.
- `playVictoryThenMedal()` : restaure **entièrement** le titre (toutes les
  `logoChars` redevenues visibles, tous les débris canvas effacés), remet le
  bouclier à sa place dans le logo (`logoBase!.after(slash!)`) *avant* de masquer
  `#game-area` (sinon le bouclier resterait invisible le temps de l'animation),
  déclenche un pulse doré (`.logo-victory`, 3× 0.4s), puis après 1300ms transforme
  définitivement le `/` en médaille (`slash.textContent = '🏅'`, classe
  `.slash-medal`) — permanent, aucun retour à l'état `/` normal.

## Constantes réglables (en tête de `TitleGuardian.astro`)

| Constante | Valeur | Rôle |
|---|---|---|
| `GLITCH_INTERVAL` | 15000ms | fréquence du glitch périodique |
| `GLITCH_ANIM_DURATION` | 1300ms | fenêtre de survol pour déclencher le jeu |
| `INITIAL_DELAY` | 600ms | délai avant la 1ère lettre tirée |
| `SALVO_LETTER_INTERVAL` | 130ms | délai entre deux lettres d'un même mot |
| `WORD_GAP_MIN` / `MAX` | 700 / 1700ms | pause aléatoire entre deux mots (et avant les lasers) |
| `LASER_GAP_MIN` / `MAX` | 700 / 1600ms | pause aléatoire avant/entre les lasers |
| `LASER_COUNT` | 3 | nombre de lasers à bloquer pour gagner |
| `LASER_MELT_INTERVAL` | 260ms | fréquence de dégâts d'un laser non bloqué |
| `TRAVEL_TIME_MS` | 1700ms | temps de trajet théorique d'un projectile (base de sa vitesse) |
| `DEFLECT_FADE_MS` | 450ms | durée du fondu d'un projectile dévié |
| `OCTOPUS_BOB_AMPLITUDE` | 16px | amplitude du mouvement vertical de la pieuvre |
| `GRAVITY` | 0.35 | accélération verticale des lettres tombées (débris canvas) |
| `RESET_DELAY_MS` | 5000ms | délai après la fin de partie avant le fondu de réinitialisation |
| `RESET_FADE_MS` | 600ms | durée du fondu (sortie puis entrée) de la réinitialisation |
| `SALVO_ACCEL_FRACTION_MIN` / `MAX` | 0.015 / 0.05 | bornes de la fraction d'accélération tirée une fois par salve de mot |
| `SHIELD_IMPACT_MS` | 260ms | durée d'affichage du flash de soudure quand le laser est bloqué net |
| `PADDLE_H` | 18px | épaisseur (hitbox verticale) du bouclier |

## Pièges déjà rencontrés

- **Sortie silencieuse du jeu après un laser bloqué (sans victoire ni
  défaite)** : le canvas de jeu fait la hauteur (fine, ~50-60px) de la nav ;
  or esquiver un laser demande des mouvements verticaux amples qui en sortent
  trivialement. L'ancienne implémentation écoutait `mousemove`/`mouseleave`
  sur le canvas lui-même, mais l'action déclenchée était destructrice :
  sortir involontairement du canvas en pleine esquive déclenchait
  `onCanvasLeave()`, qui programmait `cleanupGame()` après un délai de grâce
  de 1500ms — et pendant ce délai, le jeu continuait de tourner en aveugle
  (bouclier figé, projectiles/laser toujours actifs). Résultat perçu : la
  partie se terminait silencieusement, sans message de victoire ni de
  défaite. Fix : `onCanvasLeave` appelle désormais `pauseGame()` — qui
  **suspend** vraiment le jeu (boucle `requestAnimationFrame` arrêtée, action
  différée annulée avec son temps restant mémorisé) au lieu de le laisser
  tourner puis le réinitialiser après coup. `resumeGame()` relance tout
  exactement là où c'était à la reprise. Voir la section "Cycle de vie"
  ci-dessus (`pauseGame`/`resumeGame`).
- **Pause qui ne se déclenchait qu'en haut, jamais en bas** : une itération
  intermédiaire de ce même fix avait déplacé l'écoute au niveau
  `window`/`document.documentElement` (en pensant que ça évitait toute sortie
  triviale du canvas fin). Mais la nav est `sticky top-0` : sortir par le haut
  quitte réellement la fenêtre du navigateur (`mouseleave` sur
  `document.documentElement` se déclenche), alors que sortir par le bas
  atterrit simplement plus bas dans la page — toujours "dans" la fenêtre,
  donc jamais détecté. Fix définitif : revenir à une écoute sur le canvas
  lui-même (symétrique haut/bas/gauche/droite), la sortie triviale n'étant de
  toute façon plus un problème depuis que `onCanvasLeave` déclenche une pause
  et non une réinitialisation.
- **Le message de fin de partie interrompu trop tôt** (historique, avant le
  fix ci-dessus) : si la souris avait quitté le canvas juste avant la
  victoire/défaite, `onCanvasLeave()` avait déjà programmé l'ancien
  `cleanupGame()` via un `exitTimeout` à 1500ms. `lose()`/`win()` n'annulaient
  que `nextActionTimeout` (via `clearAllTimers()`), pas `exitTimeout` — ce
  timer orphelin se déclenchait donc quelques instants après la fin de partie
  et écrasait tout (titre restauré, zone de jeu masquée) avant que le message
  RIP/la médaille n'ait eu le temps d'être vu. Ce mécanisme (`exitTimeout`,
  `cleanupGame()`) a depuis été entièrement remplacé par `pauseGame()`/
  `resumeGame()`, qui n'ont plus ce problème : la pause n'annule ni ne
  reprogramme jamais rien de destructeur.
- **Style scopé Astro invisible depuis un autre composant** : le `<style>` de
  ce fichier cible des éléments rendus par `Header.astro` (`#site-logo`,
  `#logo-slash`, `.rip-message`...), pas par ce composant lui-même. Le scoping
  par défaut d'Astro (attribut `data-astro-cid-*` réécrit dans les sélecteurs)
  ne s'applique qu'aux éléments que *ce* composant rend — un style scopé ici
  n'aurait donc silencieusement aucun effet sur ces éléments. D'où
  `<style is:global>` en tête de ce fichier.

## Pistes d'évolution

- Ajuster la difficulté (vitesse, `TRAVEL_TIME_MS`, nombre de lasers) selon la
  largeur d'écran ou un mode "facile/difficile".
- Ajouter un score ou un historique de parties (nombre de victoires) en
  `localStorage`.
- Varier l'ennemi (autre emoji, plusieurs pieuvres) pour une difficulté croissante
  après une première victoire.
- Son (optionnel, désactivé par défaut) pour les impacts/déviations.
