/**
 * App version, sourced from package.json at build time via Vite `define`.
 * Falls back to "dev" if the define is somehow missing (e.g. in raw test runs).
 */
export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
