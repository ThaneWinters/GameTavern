-- Fix security definer view issue by recreating with security_invoker=on
DROP VIEW IF EXISTS public.games_public;

CREATE VIEW public.games_public
WITH (security_invoker=on)
AS
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