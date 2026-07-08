# CLAUDE.md

Contexte pour Claude Code sur ce dépôt. Pour la doc utilisateur (setup, commandes, déploiement), voir `README.md`.

## Le projet

Site personnel (blog + bio/CV + portfolio de projets) en Astro + Tailwind CSS v4, déployé sur GitHub Pages. Bilingue FR (défaut, non préfixé) / EN (`/en/...`). Esthétique glassmorphism (fond "aurora" animé + cartes en verre dépoli), avec transitions de page façon diaporama.

## Architecture i18n

- `src/i18n/routes.ts` (`ROUTES`) : source unique du mapping route ↔ langue. `PageKey` actuels : `home`, `posts`, `projets`, `about`.
- `src/i18n/content.ts` : accès aux données localisées (`getProfile`, `getProjects`, `getProjectsIntro`, `getUi`).
- Données dupliquées par langue dans `src/data/fr/` et `src/data/en/` (profil, projets), et `src/data/ui/{fr,en}.yaml` pour tous les libellés d'interface — jamais de texte UI en dur dans les composants/pages.
- Pages : chaque page FR (racine) a un pendant sous `src/pages/en/`, slugs traduits si besoin (ex: `a-propos/index.astro` ↔ `en/about/index.astro`). Toujours mettre à jour `ROUTES` en même temps qu'on ajoute/renomme une page.
- Détection de langue au navigateur + persistance `localStorage` gérées dans `Layout.astro` (redirection une seule fois, jamais de re-redirection forcée ensuite).

## Compétences : source unique de vérité

La grille Compétences (page `/a-propos`) et les tags mis en avant (accueil) sont **calculés**, jamais maintenus à la main :

- Tags au format `"Catégorie:Valeur"` dans `profile.yaml → parcours[].competences` et `projects.yaml → tags`.
- Un `!` en fin de valeur (`"Langages:Python!"`) marque l'élément comme mis en avant. Même convention sur `projects.yaml → nom` (`"Chocolatine!"`) pour les projets phares.
- Logique dans `src/i18n/skills.ts` : `parseTag`, `computeSkills` (grille catégorisée avec flag `featured`), `getFeaturedTags` (liste plate pour l'accueil), `parseFeaturedName` (projets), `countEntriesWithSkill` (KPI freelance).
- Ne jamais réintroduire une liste de compétences maintenue séparément — toujours dériver des tags existants.

## KPI calculés (`/a-propos`)

`profile.yaml → stats[]` : une entrée avec `kind: "experience"` ou `kind: "freelance"` est recalculée (année courante − `experienceDepuis`, et nombre d'entrées du parcours taguées `Freelancing`) ; les autres gardent leur `valeur` statique.

## Design system

- `src/components/AuroraBackground.astro` : fond animé (dégradés radiaux flous), intensité réduite en dark mode, respecte `prefers-reduced-motion`/`prefers-reduced-transparency`.
- `.glass-panel` / `.glass-card` (global.css) : fond translucide + `backdrop-filter: blur()`. `.glass-tag` : **volontairement sans blur imbriqué** (juste un fond translucide plus opaque + bordure) pour éviter le double flou et les problèmes de contraste sur les étiquettes posées sur une carte déjà floutée.
- Piège CSS déjà rencontré : une règle définie après les utilitaires Tailwind dans le *cascade* gagne à spécificité égale. `.glass-tag` avait un `display: inline-flex` inconditionnel qui écrasait silencieusement `.hidden { display: none }` de Tailwind. Toujours scoper ce genre de règle avec `:not(.hidden)` quand un élément peut être cascadé avec du contenu conditionnellement masqué.
- Thème clair/sombre : classe `.dark` sur `<html>` (pas `prefers-color-scheme` seul), toggle + persistance `localStorage` dans `ThemeToggle.astro` / script inline de `Layout.astro`.

## Transitions de page (View Transitions natives d'Astro)

`<ClientRouter />` + `transition:animate={slide()}` sur `<main>` dans `Layout.astro`. Points non-évidents :

- **Direction relative au menu**, pas à l'historique navigateur : recalculée dans `astro:before-preparation` selon la position des pages dans `NAV_ORDER` (`home, posts, projets, about`), pas le direction par défaut d'Astro.
- **Bug récurrent** : `swapRootAttributes()` (interne à Astro) remplace *tous* les attributs de `<html>` par ceux de la page statique entrante à chaque navigation — ça efface toute classe ajoutée dynamiquement (`dark`, `no-transition`) si elle n'est pas reportée sur `event.newDocument.documentElement` dans un handler `astro:before-swap`. Si un futur ajout de classe dynamique sur `<html>` disparaît après transition, c'est très probablement ça.
- **Désactiver la transition pour une navigation précise** (ex: switch FR/EN) : ajouter une classe sur `document.documentElement` dans `astro:before-preparation` (en vérifiant `event.sourceElement`), la reporter sur `newDocument` dans `astro:before-swap` (même piège que ci-dessus), la retirer dans `astro:after-swap`. CSS : `.classe::view-transition-old(*), .classe::view-transition-new(*) { animation: none !important }`.
- **Scripts interactifs** (theme toggle, sélecteur de langue, déplier compétences/projets, compteurs KPI, obfuscation mailto) : tous enregistrés sur `document.addEventListener('astro:page-load', ...)` plutôt qu'exécutés au chargement du script, sinon ils cessent de fonctionner après la première navigation SPA (les scripts non-`is:inline` sont dédupliqués par Astro et ne se ré-exécutent pas tout seuls).

## Conventions générales

- YAML privilégié pour toute donnée structurée (contenu, config) plutôt que TS/JSON en dur.
- Aucune valeur de config par défaut en dur dans le code — tout passe par les variables d'environnement `PUBLIC_*` (voir `.env.example`), avec erreur explicite si absente (`src/config.ts`).
- Toujours vérifier avec `npx astro check` puis `npm run build` après une série de modifications avant de conclure.
- Réponses et commentaires de code en français (préférence utilisateur).
