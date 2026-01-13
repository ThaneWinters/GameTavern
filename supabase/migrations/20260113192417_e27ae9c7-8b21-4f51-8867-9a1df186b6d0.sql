-- Add slug column to games table for SEO-friendly URLs
ALTER TABLE public.games ADD COLUMN slug TEXT UNIQUE;

-- Create function to generate slugs from titles
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  slug := lower(title);
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');  -- Remove special chars except spaces and hyphens
  slug := regexp_replace(slug, '\s+', '-', 'g');  -- Replace spaces with hyphens
  slug := regexp_replace(slug, '-+', '-', 'g');  -- Replace multiple hyphens with single
  slug := trim(both '-' from slug);  -- Trim leading/trailing hyphens
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing games with slugs
UPDATE public.games SET slug = generate_slug(title) WHERE slug IS NULL;

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.set_game_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_game_slug
BEFORE INSERT OR UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.set_game_slug();