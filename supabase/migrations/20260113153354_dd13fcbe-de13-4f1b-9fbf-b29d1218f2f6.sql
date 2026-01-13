-- Create enums for game categories
CREATE TYPE difficulty_level AS ENUM ('1 - Light', '2 - Medium Light', '3 - Medium', '4 - Medium Heavy', '5 - Heavy');
CREATE TYPE game_type AS ENUM ('Board Game', 'Card Game', 'Dice Game', 'Party Game', 'War Game', 'Miniatures', 'RPG', 'Other');
CREATE TYPE play_time AS ENUM ('0-15 Minutes', '15-30 Minutes', '30-45 Minutes', '45-60 Minutes', '60+ Minutes', '2+ Hours', '3+ Hours');

-- Create mechanics table for many-to-many relationship
CREATE TABLE public.mechanics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create publishers table
CREATE TABLE public.publishers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create main games table
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    additional_images TEXT[] DEFAULT '{}',
    difficulty difficulty_level DEFAULT '3 - Medium',
    game_type game_type DEFAULT 'Board Game',
    play_time play_time DEFAULT '45-60 Minutes',
    min_players INTEGER DEFAULT 1,
    max_players INTEGER DEFAULT 4,
    suggested_age TEXT DEFAULT '10+',
    publisher_id UUID REFERENCES public.publishers(id) ON DELETE SET NULL,
    bgg_id TEXT,
    bgg_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table for games and mechanics
CREATE TABLE public.game_mechanics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    mechanic_id UUID NOT NULL REFERENCES public.mechanics(id) ON DELETE CASCADE,
    UNIQUE(game_id, mechanic_id)
);

-- Insert default mechanics
INSERT INTO public.mechanics (name) VALUES 
    ('Engine Building'),
    ('Pattern Building'),
    ('Resource Management'),
    ('Set Collection'),
    ('Strategy'),
    ('Tile Placement'),
    ('Worker Placement'),
    ('Deck Building'),
    ('Area Control'),
    ('Drafting'),
    ('Hand Management'),
    ('Cooperative'),
    ('Auction'),
    ('Dice Rolling'),
    ('Route Building');

-- Insert default publishers
INSERT INTO public.publishers (name) VALUES 
    ('Allplay'),
    ('Cardboard Alchemy'),
    ('Dux Somnium Games'),
    ('Moon Saga Workshop'),
    ('Rebel Studio'),
    ('Smirk & Dagger Games'),
    ('Starling Games'),
    ('Stonemaier Games'),
    ('Fantasy Flight Games'),
    ('Days of Wonder');

-- Enable RLS on all tables (but allow public read access)
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_mechanics ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);
CREATE POLICY "Mechanics are viewable by everyone" ON public.mechanics FOR SELECT USING (true);
CREATE POLICY "Publishers are viewable by everyone" ON public.publishers FOR SELECT USING (true);
CREATE POLICY "Game mechanics are viewable by everyone" ON public.game_mechanics FOR SELECT USING (true);

-- Admin modification policies (for now allow all authenticated users to modify)
CREATE POLICY "Authenticated users can insert games" ON public.games FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update games" ON public.games FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete games" ON public.games FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert mechanics" ON public.mechanics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert publishers" ON public.publishers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can insert game_mechanics" ON public.game_mechanics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete game_mechanics" ON public.game_mechanics FOR DELETE TO authenticated USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();