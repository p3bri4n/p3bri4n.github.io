---
title: "Mon premier article"
description: "Un exemple d'article pour montrer comment publier sur ce blog."
date: 2026-07-08
tags: ["exemple"]
translationKey: "intro"
complexity: "low"
---

Ceci est un exemple d'article. Pour publier un nouvel article :

1. Crée un fichier `src/content/blog/fr/mon-slug.md` (ou `en/` pour l'anglais)
2. Renseigne le frontmatter (`title`, `description`, `date`, `tags`, `complexity`)
3. `complexity` (`low` / `medium` / `high`) ajuste le temps de lecture estimé
   à la vitesse de lecture d'un contenu simple, moyen ou technique
4. Si une traduction existe dans l'autre langue, donne-leur le même `translationKey`
   pour que le sélecteur de langue pointe vers l'article correspondant
5. Écris ton contenu en Markdown en dessous
6. Commit et push — le site se reconstruit automatiquement

Le slug de l'URL correspond au nom du fichier (sans `.md`).
