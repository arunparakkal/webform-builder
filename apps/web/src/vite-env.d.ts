/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Render API origin in production, e.g. https://webform-api.onrender.com */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PUBLIC_WEB_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
