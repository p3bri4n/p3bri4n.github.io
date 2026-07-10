function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Copie .env.example vers .env et renseigne-la.`
    );
  }
  return value;
}

const contactEmail = required('PUBLIC_CONTACT_EMAIL');
const [mailUser, mailDomain] = contactEmail.split('@');

export const site = {
  url: required('PUBLIC_SITE_URL'),
  name: required('PUBLIC_SITE_NAME'),
  contactEmail,
  mailUser,
  mailDomain,
  easterEggGame: required('PUBLIC_EASTER_EGG_GAME'),
  social: {
    github: import.meta.env.PUBLIC_GITHUB_URL ?? '',
    linkedin: import.meta.env.PUBLIC_LINKEDIN_URL ?? '',
    twitter: import.meta.env.PUBLIC_TWITTER_URL ?? '',
  },
};
