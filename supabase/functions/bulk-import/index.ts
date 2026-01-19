import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Difficulty levels from the database enum
const DIFFICULTY_LEVELS = [
  "1 - Light",
  "2 - Medium Light",
  "3 - Medium",
  "4 - Medium Heavy",
  "5 - Heavy",
];

// Play time options from database enum
const PLAY_TIME_OPTIONS = [
  "0-15 Minutes",
  "15-30 Minutes",
  "30-45 Minutes",
  "45-60 Minutes",
  "60+ Minutes",
  "2+ Hours",
  "3+ Hours",
];

// Game type options from database enum
const GAME_TYPE_OPTIONS = [
  "Board Game",
  "Card Game",
  "Dice Game",
  "Party Game",
  "War Game",
  "Miniatures",
  "RPG",
  "Other",
];

type ImportMode = "csv" | "bgg_collection" | "bgg_links";

type BulkImportRequest = {
  mode: ImportMode;
  // CSV mode
  csv_data?: string;
  // BGG collection mode
  bgg_username?: string;
  // BGG links mode
  bgg_links?: string[];
  // Common options
  enhance_with_bgg?: boolean;
  default_options?: {
    is_coming_soon?: boolean;
    is_for_sale?: boolean;
    sale_price?: number;
    sale_condition?: string;
    location_room?: string;
    location_shelf?: string;
    location_misc?: string;
    sleeved?: boolean;
    upgraded_components?: boolean;
    crowdfunded?: boolean;
    inserts?: boolean;
  };
};

type ImportResult = {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  games: { title: string; id?: string }[];
};

// Parse CSV data
function parseCSV(csvData: string): Record<string, string>[] {
  const lines = csvData.split("\n").map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }
  
  return rows;
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

// Lookup BGG data for a game title
async function lookupBGGByTitle(
  title: string,
  firecrawlKey: string,
  lovableKey: string
): Promise<{
  bgg_id?: string;
  description?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  suggested_age?: string;
  play_time?: string;
  difficulty?: string;
  game_type?: string;
  mechanics?: string[];
  publisher?: string;
} | null> {
  try {
    // Search BGG for the game
    const searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(title)}&type=boardgame&exact=1`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) {
      // Try non-exact match
      const fuzzyUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(title)}&type=boardgame`;
      const fuzzyRes = await fetch(fuzzyUrl);
      if (!fuzzyRes.ok) return null;
      
      const xml = await fuzzyRes.text();
      const idMatch = xml.match(/<item[^>]*id="(\d+)"/);
      if (!idMatch) return null;
      
      // Use bgg-lookup function to get full data
      return await fetchBGGData(idMatch[1], firecrawlKey, lovableKey);
    }
    
    const xml = await searchRes.text();
    const idMatch = xml.match(/<item[^>]*id="(\d+)"/);
    if (!idMatch) return null;
    
    return await fetchBGGData(idMatch[1], firecrawlKey, lovableKey);
  } catch (e) {
    console.error("BGG lookup error:", e);
    return null;
  }
}

// Fetch full BGG data using Firecrawl + AI
async function fetchBGGData(
  bggId: string,
  firecrawlKey: string,
  lovableKey: string
): Promise<{
  bgg_id: string;
  description?: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
  suggested_age?: string;
  play_time?: string;
  difficulty?: string;
  game_type?: string;
  mechanics?: string[];
  publisher?: string;
} | null> {
  const pageUrl = `https://boardgamegeek.com/boardgame/${bggId}`;
  
  try {
    // Scrape with Firecrawl
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: pageUrl,
        formats: ["markdown", "rawHtml"],
        onlyMainContent: true,
      }),
    });
    
    if (!scrapeRes.ok) return { bgg_id: bggId };
    
    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const rawHtml = scrapeData.data?.rawHtml || scrapeData.rawHtml || "";
    
    // Extract image
    const imageRegex = /https?:\/\/cf\.geekdo-images\.com[^\s"'<>]+/g;
    const images = rawHtml.match(imageRegex) || [];
    const uniqueImages = [...new Set(images)] as string[];
    const filtered = uniqueImages.filter((img: string) => 
      !/crop100|square30|100x100|150x150|_thumb|_avatar|_micro/i.test(img)
    );
    filtered.sort((a: string, b: string) => {
      const prio = (url: string) => {
        if (/_itemrep/i.test(url)) return 0;
        if (/_imagepage/i.test(url)) return 1;
        return 2;
      };
      return prio(a) - prio(b);
    });
    const mainImage: string | null = filtered[0] || null;
    
    // Use AI to extract
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Extract board game data. Use EXACT enum values:
- difficulty: ${DIFFICULTY_LEVELS.join(", ")}
- play_time: ${PLAY_TIME_OPTIONS.join(", ")}
- game_type: ${GAME_TYPE_OPTIONS.join(", ")}

Keep description CONCISE (100-150 words). Include brief overview and Quick Gameplay bullet points.`,
          },
          {
            role: "user",
            content: `Extract game data from: ${markdown.slice(0, 12000)}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_game",
            parameters: {
              type: "object",
              properties: {
                description: { type: "string" },
                difficulty: { type: "string", enum: DIFFICULTY_LEVELS },
                play_time: { type: "string", enum: PLAY_TIME_OPTIONS },
                game_type: { type: "string", enum: GAME_TYPE_OPTIONS },
                min_players: { type: "number" },
                max_players: { type: "number" },
                suggested_age: { type: "string" },
                mechanics: { type: "array", items: { type: "string" } },
                publisher: { type: "string" },
              },
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_game" } },
      }),
    });
    
    if (!aiRes.ok) {
      return { bgg_id: bggId, image_url: mainImage ?? undefined };
    }
    
    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return { bgg_id: bggId, image_url: mainImage ?? undefined };
    }
    
    const extracted = JSON.parse(toolCall.function.arguments);
    return {
      bgg_id: bggId,
      image_url: mainImage || undefined,
      ...extracted,
    };
  } catch (e) {
    console.error("fetchBGGData error:", e);
    return { bgg_id: bggId };
  }
}

// Fetch BGG collection for a user
async function fetchBGGCollection(username: string): Promise<{ id: string; name: string }[]> {
  // BGG collection API with retry (queued response)
  const collectionUrl = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&excludesubtype=boardgameexpansion`;
  
  let attempts = 0;
  while (attempts < 5) {
    const res = await fetch(collectionUrl);
    
    if (res.status === 202) {
      // Collection is being generated, wait and retry
      await new Promise(r => setTimeout(r, 3000));
      attempts++;
      continue;
    }
    
    if (!res.ok) {
      throw new Error(`Failed to fetch collection: ${res.status}`);
    }
    
    const xml = await res.text();
    const games: { id: string; name: string }[] = [];
    
    // Parse items
    const itemRegex = /<item[^>]*objectid="(\d+)"[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      games.push({ id: match[1], name: match[2] });
    }
    
    return games;
  }
  
  throw new Error("BGG collection request timed out");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: BulkImportRequest = await req.json();
    const { mode, csv_data, bgg_username, bgg_links, enhance_with_bgg, default_options } = body;

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
      games: [],
    };

    let gamesToImport: { title: string; bgg_id?: string; bgg_url?: string }[] = [];

    // Determine games to import based on mode
    if (mode === "csv" && csv_data) {
      const rows = parseCSV(csv_data);
      console.log(`Parsed ${rows.length} rows from CSV`);
      
      for (const row of rows) {
        const title = row.title || row.name || row.game || row["game name"] || row["game title"];
        if (title) {
          gamesToImport.push({ 
            title,
            bgg_id: row.bgg_id || row["bgg id"] || undefined,
            bgg_url: row.bgg_url || row["bgg url"] || row.url || undefined,
          });
        }
      }
    } else if (mode === "bgg_collection" && bgg_username) {
      console.log(`Fetching BGG collection for: ${bgg_username}`);
      const collection = await fetchBGGCollection(bgg_username);
      console.log(`Found ${collection.length} games in collection`);
      
      for (const game of collection) {
        gamesToImport.push({
          title: game.name,
          bgg_id: game.id,
          bgg_url: `https://boardgamegeek.com/boardgame/${game.id}`,
        });
      }
    } else if (mode === "bgg_links" && bgg_links && bgg_links.length > 0) {
      for (const link of bgg_links) {
        const idMatch = link.match(/boardgame\/(\d+)/);
        if (idMatch) {
          gamesToImport.push({
            title: "", // Will be filled by lookup
            bgg_id: idMatch[1],
            bgg_url: link,
          });
        }
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid import mode or missing data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${gamesToImport.length} games...`);

    // Process each game
    for (const gameInput of gamesToImport) {
      try {
        let gameData: {
          title: string;
          bgg_id?: string;
          bgg_url?: string;
          description?: string;
          image_url?: string;
          min_players?: number;
          max_players?: number;
          suggested_age?: string;
          play_time?: string;
          difficulty?: string;
          game_type?: string;
          mechanics?: string[];
          publisher?: string;
        } = { title: gameInput.title };

        // If we have a BGG ID and enhancement is enabled, fetch full data
        if (gameInput.bgg_id && enhance_with_bgg && firecrawlKey && lovableKey) {
          console.log(`Enhancing with BGG data: ${gameInput.bgg_id}`);
          const bggData = await fetchBGGData(gameInput.bgg_id, firecrawlKey, lovableKey);
          if (bggData) {
            gameData = { ...gameData, ...bggData, bgg_url: gameInput.bgg_url };
            // If title was empty (from bgg_links mode), we need to get it from the page
            if (!gameData.title && gameInput.bgg_url) {
              // Extract from URL as fallback
              const pathParts = gameInput.bgg_url.split("/").filter(Boolean);
              const slugPart = pathParts[pathParts.length - 1];
              if (slugPart && !/^\d+$/.test(slugPart)) {
                gameData.title = slugPart.replace(/-/g, " ").split(" ")
                  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ");
              }
            }
          }
        } else if (enhance_with_bgg && firecrawlKey && lovableKey && gameData.title) {
          // Try to lookup by title if no BGG ID
          console.log(`Looking up BGG by title: ${gameData.title}`);
          const bggData = await lookupBGGByTitle(gameData.title, firecrawlKey, lovableKey);
          if (bggData) {
            gameData = { ...gameData, ...bggData };
          }
        }

        // Skip if still no title
        if (!gameData.title) {
          result.failed++;
          result.errors.push(`Could not determine title for BGG ID: ${gameInput.bgg_id}`);
          continue;
        }

        // Check if game already exists
        const { data: existing } = await supabaseAdmin
          .from("games")
          .select("id, title")
          .eq("title", gameData.title)
          .maybeSingle();

        if (existing) {
          result.failed++;
          result.errors.push(`"${gameData.title}" already exists`);
          continue;
        }

        // Handle mechanics
        const mechanicIds: string[] = [];
        if (gameData.mechanics?.length) {
          for (const name of gameData.mechanics) {
            const { data: em } = await supabaseAdmin
              .from("mechanics")
              .select("id")
              .eq("name", name)
              .maybeSingle();
            
            if (em) {
              mechanicIds.push(em.id);
            } else {
              const { data: nm } = await supabaseAdmin
                .from("mechanics")
                .insert({ name })
                .select("id")
                .single();
              if (nm) mechanicIds.push(nm.id);
            }
          }
        }

        // Handle publisher
        let publisherId: string | null = null;
        if (gameData.publisher) {
          const { data: ep } = await supabaseAdmin
            .from("publishers")
            .select("id")
            .eq("name", gameData.publisher)
            .maybeSingle();
          
          if (ep) {
            publisherId = ep.id;
          } else {
            const { data: np } = await supabaseAdmin
              .from("publishers")
              .insert({ name: gameData.publisher })
              .select("id")
              .single();
            if (np) publisherId = np.id;
          }
        }

        // Create the game
        const { data: newGame, error: gameError } = await supabaseAdmin
          .from("games")
          .insert({
            title: gameData.title,
            description: gameData.description || null,
            image_url: gameData.image_url || null,
            bgg_id: gameData.bgg_id || null,
            bgg_url: gameData.bgg_url || null,
            min_players: gameData.min_players || 2,
            max_players: gameData.max_players || 4,
            suggested_age: gameData.suggested_age || null,
            play_time: gameData.play_time || "45-60 Minutes",
            difficulty: gameData.difficulty || "3 - Medium",
            game_type: gameData.game_type || "Board Game",
            publisher_id: publisherId,
            is_coming_soon: default_options?.is_coming_soon || false,
            is_for_sale: default_options?.is_for_sale || false,
            sale_price: default_options?.sale_price || null,
            sale_condition: default_options?.sale_condition || null,
            location_room: default_options?.location_room || null,
            location_shelf: default_options?.location_shelf || null,
            location_misc: default_options?.location_misc || null,
            sleeved: default_options?.sleeved || false,
            upgraded_components: default_options?.upgraded_components || false,
            crowdfunded: default_options?.crowdfunded || false,
            inserts: default_options?.inserts || false,
          })
          .select("id, title")
          .single();

        if (gameError || !newGame) {
          result.failed++;
          result.errors.push(`Failed to create "${gameData.title}": ${gameError?.message}`);
          continue;
        }

        // Link mechanics
        if (mechanicIds.length > 0) {
          await supabaseAdmin.from("game_mechanics").insert(
            mechanicIds.map(mid => ({ game_id: newGame.id, mechanic_id: mid }))
          );
        }

        result.imported++;
        result.games.push({ title: newGame.title, id: newGame.id });
        console.log(`Imported: ${newGame.title}`);

        // Small delay to avoid rate limits
        if (enhance_with_bgg) {
          await new Promise(r => setTimeout(r, 500));
        }
      } catch (e) {
        console.error("Game import error:", e);
        result.failed++;
        result.errors.push(`Error importing "${gameInput.title || gameInput.bgg_id}": ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Bulk import error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Bulk import failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
