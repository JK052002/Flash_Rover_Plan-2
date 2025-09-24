/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Add your environment variables here with their types
  readonly VITE_API_URL: string;
  readonly VITE_SOME_OTHER_KEY: string;
  // for example, if you have VITE_ENABLE_FEATURE=true in your .env
  readonly VITE_ENABLE_FEATURE: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}