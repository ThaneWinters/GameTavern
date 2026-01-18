-- Step 1: Create the admin-only table for private game data
CREATE TABLE public.game_admin_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL UNIQUE REFERENCES public.games(id) ON DELETE CASCADE,
    purchase_date date,
    purchase_price numeric,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Migrate existing private data from games table
INSERT INTO public.game_admin_data (game_id, purchase_date, purchase_price)
SELECT id, purchase_date, purchase_price 
FROM public.games
WHERE purchase_date IS NOT NULL OR purchase_price IS NOT NULL;

-- Step 3: Enable RLS on the new table
ALTER TABLE public.game_admin_data ENABLE ROW LEVEL SECURITY;

-- Step 4: Create admin-only policies for game_admin_data
CREATE POLICY "Admins can view game admin data"
  ON public.game_admin_data FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert game admin data"
  ON public.game_admin_data FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update game admin data"
  ON public.game_admin_data FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete game admin data"
  ON public.game_admin_data FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 5: Add public SELECT policy to games table (now safe since private data will be removed)
CREATE POLICY "Public can view games"
  ON public.games FOR SELECT
  USING (true);

-- Step 6: Drop the security definer view (no longer needed)
DROP VIEW IF EXISTS public.games_public;

-- Step 7: Recreate games_public as a simple view with security_invoker for compatibility
-- This ensures existing code continues to work
CREATE VIEW public.games_public
WITH (security_invoker=on) AS
  SELECT 
    id, title, slug, description, image_url, additional_images,
    min_players, max_players, play_time, difficulty, game_type,
    publisher_id, is_coming_soon, is_for_sale, sale_price, sale_condition,
    is_expansion, parent_game_id, in_base_game_box, sleeved,
    upgraded_components, crowdfunded, youtube_videos, suggested_age,
    bgg_id, bgg_url, location_room, location_shelf, created_at, updated_at
  FROM public.games;

-- Step 8: Remove private columns from games table (data already migrated)
ALTER TABLE public.games DROP COLUMN IF EXISTS purchase_date;
ALTER TABLE public.games DROP COLUMN IF EXISTS purchase_price;

-- Step 9: Create trigger for updated_at on game_admin_data
CREATE TRIGGER update_game_admin_data_updated_at
    BEFORE UPDATE ON public.game_admin_data
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();