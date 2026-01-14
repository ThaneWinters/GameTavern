/**
 * Site configuration - all branding can be customized via environment variables
 * 
 * Environment Variables:
 * - VITE_SITE_NAME: The name of the site (default: "My Game Library")
 * - VITE_SITE_DESCRIPTION: Meta description for SEO (default: "Browse and discover our collection of board games, card games, and more.")
 * - VITE_SITE_AUTHOR: Author meta tag (default: same as VITE_SITE_NAME)
 * - VITE_TWITTER_HANDLE: Twitter handle for social cards (optional)
 */

export const siteConfig = {
  /** The main name of the site, used in header, title, etc. */
  name: import.meta.env.VITE_SITE_NAME || "My Game Library",
  
  /** Description for SEO meta tags */
  description: import.meta.env.VITE_SITE_DESCRIPTION || 
    "Browse and discover our collection of board games, card games, and more.",
  
  /** Author name for meta tags */
  get author() {
    return import.meta.env.VITE_SITE_AUTHOR || this.name;
  },
  
  /** Twitter handle for social cards (without @) */
  twitterHandle: import.meta.env.VITE_TWITTER_HANDLE || "",
  
  /** Default collection title when no filter is active */
  collectionTitle: "Game Collection",
} as const;

export type SiteConfig = typeof siteConfig;
