export type Lang = 'fr' | 'en';

export type PageKey = 'home' | 'posts' | 'projets' | 'about' | 'cv';

export const ROUTES: Record<PageKey, Record<Lang, string>> = {
  home: { fr: '/', en: '/en' },
  posts: { fr: '/posts', en: '/en/posts' },
  projets: { fr: '/projets', en: '/en/projects' },
  about: { fr: '/a-propos', en: '/en/about' },
  cv: { fr: '/cv', en: '/en/cv' },
};

export function otherLang(lang: Lang): Lang {
  return lang === 'fr' ? 'en' : 'fr';
}
