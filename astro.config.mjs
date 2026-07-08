// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';
import yaml from '@rollup/plugin-yaml';

const { PUBLIC_SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

if (!PUBLIC_SITE_URL) {
  throw new Error(
    "Variable d'environnement manquante : PUBLIC_SITE_URL. Copie .env.example vers .env et renseigne-la."
  );
}

// https://astro.build/config
export default defineConfig({
  site: PUBLIC_SITE_URL,
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss(), yaml()]
  }
});