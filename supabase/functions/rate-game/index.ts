import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateGameRequest {
  gameId: string;
  rating: number;
  guestIdentifier: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (req.method === "POST") {
      const { gameId, rating, guestIdentifier }: RateGameRequest = await req.json();

      // Validate inputs
      if (!gameId || typeof gameId !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid game ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
        return new Response(
          JSON.stringify({ error: "Rating must be between 1 and 5" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!guestIdentifier || typeof guestIdentifier !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid guest identifier" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the game exists
      const { data: game, error: gameError } = await supabase
        .from("games_public")
        .select("id")
        .eq("id", gameId)
        .single();

      if (gameError || !game) {
        return new Response(
          JSON.stringify({ error: "Game not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert the rating (update if exists, insert if new)
      const { data, error } = await supabase
        .from("game_ratings")
        .upsert(
          {
            game_id: gameId,
            rating: Math.round(rating),
            guest_identifier: guestIdentifier,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "game_id,guest_identifier",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Error upserting rating:", error);
        return new Response(
          JSON.stringify({ error: "Failed to save rating" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, rating: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const { gameId, guestIdentifier }: { gameId: string; guestIdentifier: string } = await req.json();

      if (!gameId || !guestIdentifier) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("game_ratings")
        .delete()
        .eq("game_id", gameId)
        .eq("guest_identifier", guestIdentifier);

      if (error) {
        console.error("Error deleting rating:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete rating" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
