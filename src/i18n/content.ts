import frProfile from '../data/fr/profile.yaml';
import enProfile from '../data/en/profile.yaml';
import frProjects from '../data/fr/projects.yaml';
import enProjects from '../data/en/projects.yaml';
import frProjectsIntro from '../data/fr/projects-intro.yaml';
import enProjectsIntro from '../data/en/projects-intro.yaml';
import frUi from '../data/ui/fr.yaml';
import enUi from '../data/ui/en.yaml';
import type { Lang } from './routes';

export const profileByLang = { fr: frProfile, en: enProfile } as const;
export const projectsByLang = { fr: frProjects, en: enProjects } as const;
export const projectsIntroByLang = { fr: frProjectsIntro, en: enProjectsIntro } as const;
export const uiByLang = { fr: frUi, en: enUi } as const;

export function getProfile(lang: Lang) {
  return profileByLang[lang];
}

export function getProjects(lang: Lang) {
  return projectsByLang[lang];
}

export function getProjectsIntro(lang: Lang) {
  return projectsIntroByLang[lang];
}

export function getUi(lang: Lang) {
  return uiByLang[lang];
}
