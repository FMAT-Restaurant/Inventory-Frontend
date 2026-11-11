/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_APP_ENV?: 'dev' | 'qa' | 'prod';
  readonly VITE_USE_MOCK?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}