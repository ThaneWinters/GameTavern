const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_HOSTS = new Set(["cf.geekdo-images.com"]);

function browserLikeHeaders() {
  return {
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Referer": "https://boardgamegeek.com/",
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "cross-site",
  } as Record<string, string>;
}

async function fetchImage(url: string): Promise<Response | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: browserLikeHeaders(),
      redirect: "follow",
    });
    
    if (response.ok && response.body) {
      return response;
    }
    console.log(`image-proxy: fetch failed for ${url} with status ${response.status}`);
  } catch (e) {
    console.log(`image-proxy: fetch error for ${url}:`, e);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("url");

    if (!target) {
      return new Response("Missing url", { status: 400, headers: corsHeaders });
    }

    // Normalize encoded parentheses - Geekdo's CDN requires literal ()
    let normalizedTarget = target
      .replace(/%28/gi, "(")
      .replace(/%29/gi, ")")
      .replace(/%2528/gi, "(")
      .replace(/%2529/gi, ")")
      .replace(/&quot;.*$/, "")
      .replace(/;$/, "");

    let targetUrl: URL;
    try {
      targetUrl = new URL(normalizedTarget);
    } catch {
      return new Response("Invalid url", { status: 400, headers: corsHeaders });
    }

    if (targetUrl.protocol !== "https:") {
      return new Response("Invalid protocol", { status: 400, headers: corsHeaders });
    }

    if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
      return new Response("Host not allowed", { status: 403, headers: corsHeaders });
    }

    // Try fetching the image
    const successResponse = await fetchImage(normalizedTarget);

    if (!successResponse) {
      console.error("image-proxy: failed to fetch", normalizedTarget);
      // Return a 1x1 transparent PNG instead of redirecting (which doesn't work due to CORS)
      const transparentPng = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
      ]);
      return new Response(transparentPng, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60",
        },
      });
    }

    const contentType = successResponse.headers.get("content-type") || "image/jpeg";

    return new Response(successResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("image-proxy error", e);
    return new Response("Proxy error", { status: 500, headers: corsHeaders });
  }
});
