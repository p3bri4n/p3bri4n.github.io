# p3bri4n.github.io

Site personnel construit avec [Astro](https://astro.build) et [Tailwind CSS](https://tailwindcss.com), déployé sur GitHub Pages. Disponible en français (par défaut) et en anglais (`/en/...`).

Nav principale : Accueil | Posts | Projets | À propos.

- **Accueil** : hero impactant ("Bonjour, je suis ...", métier, accroche courte), 2 boutons (Voir les projets / Voir le blog), puis les tags mis en avant
- **À propos** (`/a-propos`) : page unique façon CV — bio, avatar, stats KPI, compétences (grille complète, dépliable), puis le parcours professionnel complet

## Structure

```text
src/
├── config.ts                  # lit les variables d'environnement PUBLIC_*
├── i18n/
│   ├── routes.ts               # table des routes par langue (ROUTES)
│   ├── content.ts               # accès aux données localisées (profil, projets, UI)
│   ├── skills.ts                # calcule les Compétences depuis parcours + projets, gère le "!"
│   └── readingTime.ts           # calcule le temps de lecture des articles
├── data/
│   ├── fr/ et en/               # profile.yaml, projects.yaml, projects-intro.yaml par langue
│   └── ui/                      # fr.yaml / en.yaml : libellés de nav, boutons, aria-labels
├── content/blog/
│   ├── fr/*.md et en/*.md       # articles de blog par langue (frontmatter YAML)
│   └── ...
├── content.config.ts           # schéma de la collection "blog"
├── layouts/                     # Layout.astro (page, View Transitions) + BlogPost.astro (article)
├── components/                  # Header, HeaderTools (icônes + langue + thème, partagé),
│                                 # SkillGroup (avec bouton déplier/replier), etc.
└── pages/
    ├── index.astro               # accueil FR (hero, boutons, tags mis en avant)
    ├── posts/                     # liste + article de blog FR
    ├── projets.astro              # page complète des projets FR
    ├── a-propos/index.astro       # page À propos FR (bio + stats + compétences + parcours, façon CV)
    └── en/                        # pendant EN de toutes les pages ci-dessus
```

## Internationalisation (FR/EN)

Le FR est la langue par défaut (routes non préfixées : `/`, `/projets`, `/a-propos`...), l'EN est préfixé (`/en`, `/en/about`...). Le mapping des routes est centralisé dans `src/i18n/routes.ts` (`ROUTES`).

- **Contenu structuré** (bio, parcours, projets, objectifs) : dupliqué dans `src/data/fr/` et `src/data/en/`, à traduire à la main.
- **Libellés d'interface** (nav, boutons, aria-labels) : `src/data/ui/fr.yaml` et `src/data/ui/en.yaml`.
- **Articles de blog** : un fichier par langue dans `src/content/blog/fr/` ou `src/content/blog/en/`. Si un article existe dans les deux langues, donne-leur le même `translationKey` dans le frontmatter pour que le sélecteur de langue pointe vers l'article correspondant (sinon il retombe sur la liste des articles de l'autre langue).
- **Pages** : chaque page FR a un pendant EN dans `src/pages/en/`, avec un nom de fichier qui peut différer (ex: `a-propos/index.astro` ↔ `en/about/index.astro`) tant que `ROUTES` est mis à jour en conséquence.
- **Détection automatique** : au premier chargement (aucune préférence enregistrée), la langue du navigateur est détectée et redirige une seule fois vers l'équivalent de la page visitée. Le choix (auto ou manuel via le sélecteur FR/EN) est mémorisé dans `localStorage`, sans re-rediriger ensuite.

Pour ajouter une nouvelle page dans les deux langues : créer le fichier `.astro` de chaque côté, ajouter une clé dans `ROUTES` (`src/i18n/routes.ts`), et un libellé de nav dans les deux fichiers `ui/*.yaml` si elle doit apparaître dans le header.

## Compétences (source unique de vérité) et mise en avant

La grille Compétences de la page À propos n'est **pas** maintenue à la main : elle est calculée automatiquement à partir des tags du parcours (`profile.yaml → parcours[].competences`) et des projets (`projects.yaml → tags`).

Chaque tag suit le format `"Catégorie:Valeur"`, avec un `!` optionnel en fin de valeur pour la mettre en avant :

```yaml
competences: ["Langages:Python!", "Outils:Docker", "Méthodologies:TDD"]
```

Sur À propos, seul "Python" est affiché par défaut dans la grille ; "Docker" et "TDD" n'apparaissent qu'après avoir cliqué sur "Voir toutes les compétences". Sur l'**accueil**, seuls les tags marqués `!` apparaissent (liste plate, sans catégorie, sans bouton déplier — un simple aperçu). Catégories utilisées (définies dans `src/data/ui/fr.yaml` et `en.yaml` → `skillCategories`) : **Langages, Outils, Méthodologies, Domaines**.

Un même tag (ex: `"Langages:Python"`) peut apparaître dans plusieurs entrées du parcours et projets : il n'apparaîtra qu'une seule fois ; il suffit qu'**une seule** occurrence porte le `!` pour que la compétence soit mise en avant partout.

Pour ajouter une compétence, il suffit d'ajouter le tag correspondant à une entrée du parcours ou d'un projet — pas besoin d'éditer une liste séparée.

**KPI calculés** : `profile.yaml → experienceDepuis` (année) donne le nombre d'années d'expérience (année courante − cette valeur) ; le nombre de missions freelance compte les entrées du parcours portant un tag `Freelancing`. Un stat déclaré `kind: "experience"` ou `kind: "freelance"` dans `profile.yaml → stats` est calculé ainsi ; les autres gardent leur `valeur` telle quelle.

**Projets mis en avant** : même convention `!`, appliquée au nom du projet dans `projects.yaml` :

```yaml
nom: "Chocolatine!"
```

Le `!` est retiré à l'affichage. La page `/projets` affiche toujours tous les projets ; l'accueil ne montre que les tags mis en avant (pas de grille de projets).

## Transitions de page

Le site utilise les View Transitions natives d'Astro (`<ClientRouter />`) avec un glissement horizontal (`slide()`) façon diaporama sur le `<main>`. Particularités gérées dans `Layout.astro` :

- **Direction relative au menu** : au lieu de suivre l'historique du navigateur, la direction (avant/arrière) est calculée selon la position des pages dans l'ordre du menu principal (`Accueil, Posts, Projets, À propos`) — aller vers une section plus loin glisse vers l'avant, vers une section précédente glisse vers l'arrière.
- **Changement de langue sans transition** : cliquer FR/EN ne déclenche aucune animation (classe `.no-transition` posée avant la navigation, retirée juste après).
- **Persistance du thème** : un bug connu des View Transitions remplace tous les attributs de `<html>` par ceux de la page entrante (donc la classe `dark`, ajoutée dynamiquement, disparaîtrait à chaque navigation). Elle est reportée manuellement sur le document entrant juste avant le swap.
- Les scripts interactifs (thème, sélecteur de langue, déplier compétences/projets, compteurs KPI, obfuscation du mailto) s'enregistrent sur l'évènement `astro:page-load` pour continuer à fonctionner après chaque transition (pas seulement au premier chargement).

## Configuration

Toute la personnalisation (nom, e-mail, liens sociaux) passe par des variables d'environnement préfixées `PUBLIC_` (requis par Astro pour les exposer côté client).

1. Copie `.env.example` en `.env`
2. Renseigne tes valeurs

```sh
cp .env.example .env
```

Pour le déploiement, les mêmes variables doivent être définies dans **Settings → Secrets and variables → Actions → Variables** du dépôt GitHub (onglet "Variables", pas "Secrets", car ce ne sont pas des données sensibles).

## Publier un article

1. Crée un fichier `src/content/blog/fr/mon-slug.md` (ou `en/` pour l'anglais) — apparaît automatiquement dans `/posts`
2. Renseigne le frontmatter :

```yaml
---
title: "Titre de l'article"
description: "Résumé court"
date: 2026-07-08T08:30:00  # inclure une heure (arbitraire si besoin) pour un tri correct entre articles du même jour
tags: ["astro", "exemple"]
translationKey: "mon-slug"  # optionnel : identique des deux côtés pour lier les traductions
complexity: "medium"         # low / medium / high — ajuste le temps de lecture estimé
---
```

3. Écris le contenu en Markdown en dessous
4. Commit et push sur `main` — le site est reconstruit et déployé automatiquement

## Commandes

| Commande          | Action                                         |
| :----------------- | :---------------------------------------------- |
| `npm install`      | Installe les dépendances                        |
| `npm run dev`       | Lance le serveur de dev sur `localhost:4321`   |
| `npm run build`     | Build de production dans `./dist/`             |
| `npm run preview`   | Prévisualise le build localement                |
| `npx astro check`  | Vérifie les types                               |

## Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` build et déploie automatiquement à chaque push sur `main`.

À faire une seule fois dans les paramètres du dépôt GitHub :

1. **Settings → Pages → Source** : choisir "GitHub Actions"
2. **Settings → Secrets and variables → Actions → Variables** : ajouter les variables `PUBLIC_*` (voir `.env.example`)
