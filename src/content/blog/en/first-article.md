---
title: "My first article"
description: "An example article showing how to publish on this blog."
date: 2026-07-08
tags: ["example"]
translationKey: "intro"
complexity: "low"
---

This is an example article. To publish a new one:

1. Create a file `src/content/blog/en/my-slug.md` (or `fr/` for French)
2. Fill in the frontmatter (`title`, `description`, `date`, `tags`, `complexity`)
3. `complexity` (`low` / `medium` / `high`) adjusts the estimated reading time
   to the pace of simple, average, or technical content
4. If a translation exists in the other language, give both the same
   `translationKey` so the language switcher links to the matching article
5. Write your content in Markdown below
6. Commit and push — the site rebuilds automatically

The URL slug matches the file name (without `.md`).
