/**
 * Site configuration - all branding can be customized via environment variables
 * 
 * Supports two deployment modes:
 * 1. Lovable/Vite: Uses VITE_* environment variables (build-time)
 * 2. Cloudron: Uses window.__RUNTIME_CONFIG__ (injected at container start)
 * 
 * Priority: Runtime Config → Vite Env → Defaults
 */

import { getConfig } from './runtime';

export const siteConfig = {
  /** The main name of the site, used in header, title, etc. */
  get name(): string {
    return getConfig('SITE_NAME', 'VITE_SITE_NAME', 'My Game Library');
  },
  
  /** Description for SEO meta tags */
  get description(): string {
    return getConfig(
      'SITE_DESCRIPTION', 
      'VITE_SITE_DESCRIPTION', 
      'Browse and discover our collection of board games, card games, and more.'
    );
  },
  
  /** Author name for meta tags */
  get author(): string {
    return getConfig('SITE_AUTHOR', 'VITE_SITE_AUTHOR', '') || this.name;
  },
  
  /** Twitter handle for social cards (without @) */
  get twitterHandle(): string {
    return import.meta.env.VITE_TWITTER_HANDLE || '';
  },
  
  /** Default collection title when no filter is active */
  collectionTitle: "Game Collection",
} as const;

export type SiteConfig = typeof siteConfig;
