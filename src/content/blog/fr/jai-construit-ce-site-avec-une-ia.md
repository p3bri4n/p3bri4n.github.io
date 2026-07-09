---
title: "J'ai construit ce site avec une IA (et non, ce n'est pas du grand n'importe quoi)"
description: "Retour d'expérience sur la construction de ce blog avec Claude Code : ce qui marche bien, ce qui coince, et pourquoi le résultat est loin d'être du bullshit généré à la chaîne."
date: 2026-07-09
tags: ["ia", "astro", "dev", "meta"]
complexity: "low"
---

Bon, allez, je me lance. Premier vrai article de ce blog flambant neuf, et autant commencer par le commencement : **ce site, je l'ai construit avec une IA**. Pas "un peu aidé par", pas "j'ai demandé un logo à ChatGPT" — non, la quasi-totalité du code que vous voyez tourner en ce moment (Astro, Tailwind v4, i18n FR/EN, le petit fond "aurora" qui bouge en arrière-plan) est sortie d'une conversation avec Claude Code, l'outil en ligne de commande d'Anthropic.

Je sais ce que certains pensent déjà : "encore un site généré à l'arrache par une IA, ça va sentir le template Bootstrap réchauffé". Sauf que non. Et je vais vous expliquer pourquoi.

## Le principe : je décris, l'IA code, je corrige

Concrètement, ça ne s'est pas passé comme "génère-moi un site perso" en une seule prompt magique suivie d'un site qui sort tout cuit. Ça a été une vraie session de dev, itérative, exactement comme si je bossais avec un(e) collègue junior très rapide mais qui a besoin qu'on lui précise les choses.

Exemple concret : sur la page d'accueil, mon nom complet ("Pierre-Emmanuel Brian", excusez du peu) se retrouvait coupé en deux lignes dans le gros titre. Pas franchement le rendu classe qu'on veut sur une hero section. Au lieu de corriger le CSS moi-même, j'ai juste demandé "pourquoi mon prénom+nom est en deux lignes ?". L'IA a été lire le composant, a identifié que le `<h1>` n'avait ni `whitespace-nowrap` ni de taille de police adaptée à un nom aussi long, et m'a proposé deux solutions avant de corriger. Pas de blabla, un diagnostic, une correction ciblée.

## Le vrai boulot, c'est le débogage

Là où ça devient intéressant, c'est sur les bugs plus vicieux. Le header de ce site a une hauteur qui variait selon la page visitée — un pixel par-ci, deux par-là, rien d'énorme mais assez pour que ça pique les yeux. J'ai juste signalé le symptôme, sans donner la cause. L'IA a creusé, comparé le CSS entre les pages, et a fini par trouver que le lien de navigation actif passait en `font-medium` (gras) uniquement sur sa propre page — ce qui l'élargissait juste assez pour faire basculer le menu sur deux lignes, mais seulement sur certaines pages selon la largeur de la fenêtre. Un bug de cascade CSS assez classique, mais franchement pas le genre de truc qu'on repère en deux secondes en regardant l'écran.

Autre exemple : j'ai eu l'impression, à un moment, que la taille du logo changeait entre deux versions de la même page (FR vs EN, "Posts"). Panique légère. Sauf que l'IA a comparé le HTML généré par le serveur pour chaque page, montré que le code source était rigoureusement identique partout, et a fini par pointer du doigt... le cache du navigateur suite à un rechargement SPA (les fameuses View Transitions d'Astro). Un `Ctrl+Shift+R` plus tard, effectivement, tout était rentré dans l'ordre. Ce genre de diagnostic — "ce n'est pas un bug de code, c'est un problème de cache côté navigateur" — c'est exactement le genre de raisonnement qui distingue un outil qui *patche à l'aveugle* d'un outil qui *comprend le système*.

## Ce qui a vraiment changé ma façon de bosser

- **Itérer vite sur le design.** J'ai testé une police de logo façon vieux terminal CRT (VT323, très geek, un peu too much), avant de repasser sur quelque chose de plus sobre (JetBrains Mono). Chaque changement de direction s'est fait en une phrase, sans avoir à rouvrir un fichier CSS moi-même.
- **Garder une architecture propre.** Ce site calcule automatiquement sa grille de compétences à partir de tags posés sur mon parcours et mes projets (`"Langages:Python!"`, le `!` marquant la mise en avant) plutôt que de maintenir une liste à la main quelque part. C'est le genre de décision d'architecture qu'on prend en discutant, pas en tapant du code au kilomètre.
- **Ne pas perdre le fil.** Les instructions et pièges déjà rencontrés (comme le bug des View Transitions qui efface les classes CSS dynamiques sur `<html>` à chaque navigation) sont documentés dans un fichier `CLAUDE.md` à la racine du projet. Résultat : je ne réexplique jamais deux fois le même piège, l'IA le connaît déjà au prochain démarrage de session.

## Bon, alors, l'IA a tout fait toute seule ?

Non, clairement pas. Moi j'ai posé les choix structurants (bilingue FR/EN, esthétique glassmorphism, ce style de transition façon diaporama entre les pages), j'ai testé chaque page dans le navigateur, j'ai recadré quand le résultat ne me plaisait pas ("un peu moins geek", "on peut l'agrandir ?"). L'IA, elle, a fait le gros du café : écrire le code, chercher les causes de bugs, respecter une architecture cohérente sur des dizaines de fichiers sans que je doive tout relire ligne par ligne.

Le résultat, vous l'avez sous les yeux. Si vous trouvez un bug ou une incohérence quelque part sur ce site, dites-le moi — statistiquement, il y a de bonnes chances que ce soit passé entre les mailles du filet d'une conversation qui allait un peu trop vite. 😅
