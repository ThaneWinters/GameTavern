-- Add youtube_videos column to games table for storing YouTube video URLs
ALTER TABLE public.games
ADD COLUMN youtube_videos text[] DEFAULT '{}';

-- Also add to the games_public view by recreating it
DROP VIEW IF EXISTS public.games_public;
CREATE VIEW public.games_public AS
SELECT
  id,
  slug,
  title,
  description,
  image_url,
  additional_images,
  difficulty,
  game_type,
  play_time,
  min_players,
  max_players,
  suggested_age,
  publisher_id,
  bgg_id,
  bgg_url,
  is_coming_soon,
  is_for_sale,
  sale_price,
  sale_condition,
  is_expansion,
  parent_game_id,
  in_base_game_box,
  location_room,
  location_shelf,
  sleeved,
  upgraded_components,
  crowdfunded,
  youtube_videos,
  created_at,
  updated_at
FROM public.games;