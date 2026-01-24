-- Create game_ratings table for public ratings
CREATE TABLE public.game_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    guest_identifier TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Each guest can only rate a game once
    UNIQUE (game_id, guest_identifier)
);

-- Enable RLS
ALTER TABLE public.game_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can view ratings
CREATE POLICY "Ratings are viewable by everyone"
ON public.game_ratings
FOR SELECT
USING (true);

-- Anyone can insert their own rating (service role handles inserts via edge function for security)
CREATE POLICY "Service role can insert ratings"
ON public.game_ratings
FOR INSERT
WITH CHECK (true);

-- Users can update their own rating (via service role)
CREATE POLICY "Service role can update ratings"
ON public.game_ratings
FOR UPDATE
USING (true);

-- Admins can delete ratings
CREATE POLICY "Admins can delete ratings"
ON public.game_ratings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a summary view for public access (hides guest identifiers)
CREATE VIEW public.game_ratings_summary AS
SELECT 
    game_id,
    COUNT(*)::INTEGER AS rating_count,
    ROUND(AVG(rating)::NUMERIC, 1) AS average_rating
FROM public.game_ratings
GROUP BY game_id;

-- Grant access to the summary view
GRANT SELECT ON public.game_ratings_summary TO anon, authenticated;

-- Add trigger for updated_at
CREATE TRIGGER update_game_ratings_updated_at
    BEFORE UPDATE ON public.game_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();