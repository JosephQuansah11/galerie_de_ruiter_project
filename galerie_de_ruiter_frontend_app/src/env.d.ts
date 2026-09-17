interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_RECONSTRUCTION_API_URL?: string;
  // add other variables you use
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}