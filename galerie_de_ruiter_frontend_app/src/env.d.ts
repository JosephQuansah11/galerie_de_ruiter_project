interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Largest .glb the form accepts, in MB. Keep in step with the API's MODELS_MAX_SIZE_MB. */
  readonly VITE_MODELS_MAX_SIZE_MB?: string;
  /**
   * Google Maps browser key: the location page's Embed API frame and the admin's geocoding. Without
   * it the location page shows the address and a link to Google Maps instead of a frame.
   */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  // add other variables you use
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}