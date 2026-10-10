interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_RECONSTRUCTION_API_URL?: string;
  /** Largest .glb the form accepts, in MB. Keep in step with the API's MODELS_MAX_SIZE_MB. */
  readonly VITE_MODELS_MAX_SIZE_MB?: string;
  // add other variables you use
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}