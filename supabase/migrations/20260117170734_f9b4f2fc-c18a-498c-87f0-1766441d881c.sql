-- Add column to track if expansion is stored in same box as parent game
ALTER TABLE public.games ADD COLUMN in_base_game_box boolean DEFAULT false;

-- Update the games_public view to include the new column
DROP VIEW IF EXISTS public.games_public;
CREATE VIEW public.games_public AS
SELECT 
  id, title, description, image_url, additional_images,
  difficulty, game_type, play_time, min_players, max_players,
  suggested_age, publisher_id, bgg_id, bgg_url, is_coming_soon,
  is_for_sale, sale_price, sale_condition, is_expansion, parent_game_id,
  location_room, location_shelf, sleeved, upgraded_components, crowdfunded,
  slug, created_at, updated_at, in_base_game_box
FROM public.games;