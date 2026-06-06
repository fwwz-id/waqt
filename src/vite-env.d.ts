/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />

interface ImportMetaEnv {
  /** Cloudflare Worker base URL for Level 2 Web Push. */
  readonly VITE_PUSH_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** App version, injected from package.json at build time (see vite.config.ts). */
declare const __APP_VERSION__: string;
