-- Add a policy to allow public read access to games (for the games_public view)
-- The games_public view already excludes sensitive columns (purchase_price, purchase_date)
CREATE POLICY "Public can view games via games_public view"
ON public.games
FOR SELECT
TO anon, authenticated
USING (true);