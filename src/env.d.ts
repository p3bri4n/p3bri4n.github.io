/// <reference types="astro/client" />

declare module '*.yaml' {
  const data: any;
  export default data;
}

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_SITE_NAME: string;
  readonly PUBLIC_CONTACT_EMAIL: string;
  readonly PUBLIC_GITHUB_URL: string;
  readonly PUBLIC_LINKEDIN_URL: string;
  readonly PUBLIC_TWITTER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
