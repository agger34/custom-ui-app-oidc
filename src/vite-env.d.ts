/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AM_BASE_URL: string;
  readonly VITE_DEFAULT_REALM: string;
  readonly VITE_DEFAULT_TREE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
