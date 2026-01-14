import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns an image URL, using proxy for BGG images to bypass hotlink protection.
 * Falls back to direct URL if proxy isn't available.
 * 
 * BGG's CDN (cf.geekdo-images.com) has hotlink protection that blocks requests
 * without proper Referer headers. Our proxy adds appropriate headers.
 */
export function proxiedImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  try {
    const u = new URL(url);
    
    // Only proxy BGG images
    if (u.hostname === "cf.geekdo-images.com") {
      // Clean up the URL - normalize encoded parentheses and remove garbage from scraping
      let normalized = url
        .replace(/%28/g, "(")
        .replace(/%29/g, ")")
        .replace(/%2528/g, "(")  // Double-encoded
        .replace(/%2529/g, ")")
        .replace(/&quot;.*$/, "") // Remove HTML entities from bad scraping
        .replace(/;$/, "");       // Remove trailing semicolons
      
      // Try the proxy first, but the component should handle errors gracefully
      return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(normalized)}`;
    }
    
    return url;
  } catch {
    return url;
  }
}

/**
 * Get direct URL without proxy - used as fallback when proxy fails
 */
export function directImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  
  try {
    // Clean up the URL
    return url
      .replace(/%28/g, "(")
      .replace(/%29/g, ")")
      .replace(/%2528/g, "(")
      .replace(/%2529/g, ")")
      .replace(/&quot;.*$/, "")
      .replace(/;$/, "");
  } catch {
    return url;
  }
}
