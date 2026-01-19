-- Add location_misc column for miscellaneous location notes
ALTER TABLE public.games ADD COLUMN location_misc text DEFAULT NULL;