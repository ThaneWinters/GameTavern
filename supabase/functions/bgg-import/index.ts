import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's auth token to verify identity
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user token using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Create admin client with service role to check user_roles table
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user has admin role in user_roles table
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

    const { url } = await req.json();
    
    // Extract BGG ID from URL
    const bggIdMatch = url.match(/boardgamegeek\.com\/boardgame\/(\d+)/);
    if (!bggIdMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid BoardGameGeek URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bggId = bggIdMatch[1];
    
    // Fetch from BGG XML API
    const apiUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`;
    const bggResponse = await fetch(apiUrl);
    const xmlText = await bggResponse.text();

    // Parse XML (simple parsing)
    const getName = (xml: string) => {
      const match = xml.match(/<name type="primary" value="([^"]+)"/);
      return match ? match[1] : "Unknown Game";
    };

    const getDescription = (xml: string) => {
      const match = xml.match(/<description>([^<]*)<\/description>/s);
      if (!match) return null;
      // Sanitize: decode HTML entities and strip any HTML tags
      return match[1]
        .replace(/&#10;/g, "\n")
        .replace(/<[^>]+>/g, "") // Remove any HTML tags
        .trim()
        .slice(0, 2000);
    };

    const getImage = (xml: string) => {
      const match = xml.match(/<image>([^<]+)<\/image>/);
      return match ? match[1] : null;
    };

    const getMinPlayers = (xml: string) => {
      const match = xml.match(/<minplayers value="(\d+)"/);
      return match ? parseInt(match[1]) : 1;
    };

    const getMaxPlayers = (xml: string) => {
      const match = xml.match(/<maxplayers value="(\d+)"/);
      return match ? parseInt(match[1]) : 4;
    };

    const getPlayTime = (xml: string) => {
      const match = xml.match(/<playingtime value="(\d+)"/);
      const time = match ? parseInt(match[1]) : 45;
      if (time <= 15) return "0-15 Minutes";
      if (time <= 30) return "15-30 Minutes";
      if (time <= 45) return "30-45 Minutes";
      if (time <= 60) return "45-60 Minutes";
      if (time <= 120) return "60+ Minutes";
      if (time <= 180) return "2+ Hours";
      return "3+ Hours";
    };

    const getWeight = (xml: string) => {
      const match = xml.match(/<averageweight value="([\d.]+)"/);
      const weight = match ? parseFloat(match[1]) : 2.5;
      if (weight < 1.5) return "1 - Light";
      if (weight < 2.5) return "2 - Medium Light";
      if (weight < 3.5) return "3 - Medium";
      if (weight < 4.5) return "4 - Medium Heavy";
      return "5 - Heavy";
    };

    const getAge = (xml: string) => {
      const match = xml.match(/<minage value="(\d+)"/);
      return match ? `${match[1]}+` : "10+";
    };

    const title = getName(xmlText);
    const gameData = {
      title,
      description: getDescription(xmlText),
      image_url: getImage(xmlText),
      additional_images: [],
      difficulty: getWeight(xmlText),
      game_type: "Board Game",
      play_time: getPlayTime(xmlText),
      min_players: getMinPlayers(xmlText),
      max_players: getMaxPlayers(xmlText),
      suggested_age: getAge(xmlText),
      bgg_id: bggId,
      bgg_url: url,
    };

    // Use admin client for database operations (bypasses RLS for this trusted operation)
    const { data, error } = await supabaseAdmin.from("games").insert(gameData).select().single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, game: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("BGG import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
